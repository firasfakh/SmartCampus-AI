"""
SmartCampus AI — Conversations et mémoire (SA-24 / SA-26).

Une conversation appartient SOIT à une session visiteur (en-tête X-Visitor-Token),
SOIT à un candidat connecté (Bearer JWT). Si les deux sont fournis, le compte
connecté est prioritaire. Une conversation d'un autre propriétaire renvoie 404
(on ne révèle pas son existence).
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_optional_current_user, get_visitor_session
from app.database.connection import get_db_session
from app.models.conversations import Conversation
from app.models.messages import Message
from app.models.visitor_sessions import VisitorSession
from app.services.assistant import generate_reply
from app.services.memory import build_memory
from app.services.visitor_sessions import session_usage

router = APIRouter()

DEFAULT_TITLE = "Nouvelle conversation"


class ConversationCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class ConversationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = Field(default=None, pattern="^(active|archived)$")


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


# ------------------------------------------------------------------ helpers

class Owner:
    """Propriétaire de la requête : candidat connecté ou session visiteur."""

    def __init__(self, user_payload: dict | None, visitor: VisitorSession | None):
        if user_payload is None and visitor is None:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED,
                "Créez une session visiteur ou connectez-vous pour utiliser l'assistant.",
            )
        if user_payload is not None and user_payload["role"] != "candidate":
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "L'assistant d'orientation est réservé aux visiteurs et aux candidats.",
            )
        self.user = user_payload["user"] if user_payload else None
        self.visitor = None if user_payload else visitor

    @property
    def filter(self):
        if self.user is not None:
            return Conversation.user_id == self.user.id
        return Conversation.visitor_session_id == self.visitor.id

    @property
    def is_visitor(self) -> bool:
        return self.user is None


def get_owner(
    user_payload: dict | None = Depends(get_optional_current_user),
    visitor: VisitorSession | None = Depends(get_visitor_session),
) -> Owner:
    return Owner(user_payload, visitor)


async def _owned_conversation(
    db: AsyncSession, conversation_id: UUID, owner: Owner, lock: bool = False
) -> Conversation:
    stmt = select(Conversation).where(Conversation.id == conversation_id, owner.filter)
    if lock:
        stmt = stmt.with_for_update()
    conversation = await db.scalar(stmt)
    if conversation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation introuvable.")
    return conversation


def _conversation_dict(c: Conversation, message_count: int | None = None) -> dict:
    data = {
        "id": str(c.id),
        "title": c.title or DEFAULT_TITLE,
        "status": c.status,
        "owner_type": "candidate" if c.user_id else "visitor",
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "last_message_at": c.last_message_at,
    }
    if message_count is not None:
        data["message_count"] = message_count
    return data


def _message_dict(m: Message) -> dict:
    return {
        "id": str(m.id),
        "conversation_id": str(m.conversation_id),
        "sequence_no": m.sequence_no,
        "role": m.sender_type,
        "content": m.content,
        "created_at": m.created_at,
    }


# ------------------------------------------------------------------ routes

@router.post("/", status_code=status.HTTP_201_CREATED, summary="Créer une conversation")
async def create_conversation(
    body: ConversationCreate,
    owner: Owner = Depends(get_owner),
    db: AsyncSession = Depends(get_db_session),
):
    if owner.is_visitor:
        usage = await session_usage(db, owner.visitor.id)
        if usage["conversations"] >= settings.VISITOR_MAX_CONVERSATIONS:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "Nombre maximal de conversations visiteur atteint. "
                "Créez un compte pour continuer et conserver votre historique.",
            )
    conversation = Conversation(
        user_id=owner.user.id if owner.user else None,
        visitor_session_id=owner.visitor.id if owner.visitor else None,
        title=(body.title or "").strip() or DEFAULT_TITLE,
        status="active",
    )
    db.add(conversation)
    await db.flush()
    return _conversation_dict(conversation, message_count=0)


@router.get("/", summary="Lister mes conversations")
async def list_conversations(
    owner: Owner = Depends(get_owner),
    db: AsyncSession = Depends(get_db_session),
):
    counts = (
        select(Message.conversation_id, func.count(Message.id).label("n"))
        .group_by(Message.conversation_id)
        .subquery()
    )
    rows = (await db.execute(
        select(Conversation, func.coalesce(counts.c.n, 0))
        .outerjoin(counts, counts.c.conversation_id == Conversation.id)
        .where(owner.filter)
        .order_by(func.coalesce(Conversation.last_message_at, Conversation.created_at).desc())
    )).all()
    return [_conversation_dict(c, n) for c, n in rows]


@router.get("/{conversation_id}", summary="Détail d'une conversation")
async def get_conversation(
    conversation_id: UUID,
    owner: Owner = Depends(get_owner),
    db: AsyncSession = Depends(get_db_session),
):
    conversation = await _owned_conversation(db, conversation_id, owner)
    count = await db.scalar(
        select(func.count(Message.id)).where(Message.conversation_id == conversation.id)
    )
    return _conversation_dict(conversation, count or 0)


@router.patch("/{conversation_id}", summary="Renommer ou archiver une conversation")
async def update_conversation(
    conversation_id: UUID,
    body: ConversationUpdate,
    owner: Owner = Depends(get_owner),
    db: AsyncSession = Depends(get_db_session),
):
    conversation = await _owned_conversation(db, conversation_id, owner, lock=True)
    values = body.model_dump(exclude_unset=True, exclude_none=True)
    if "title" in values:
        conversation.title = values["title"].strip()
    if "status" in values:
        conversation.status = values["status"]
    conversation.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return _conversation_dict(conversation)


@router.get("/{conversation_id}/messages", summary="Historique des messages")
async def get_messages(
    conversation_id: UUID,
    owner: Owner = Depends(get_owner),
    db: AsyncSession = Depends(get_db_session),
):
    conversation = await _owned_conversation(db, conversation_id, owner)
    messages = (await db.scalars(
        select(Message).where(Message.conversation_id == conversation.id).order_by(Message.sequence_no)
    )).all()
    return [_message_dict(m) for m in messages]


@router.get(
    "/{conversation_id}/memory",
    summary="Mémoire de travail (fenêtre de messages + indices de profil)",
)
async def get_memory(
    conversation_id: UUID,
    owner: Owner = Depends(get_owner),
    db: AsyncSession = Depends(get_db_session),
):
    conversation = await _owned_conversation(db, conversation_id, owner)
    return {"conversation_id": str(conversation.id), **await build_memory(db, conversation.id)}


@router.post(
    "/{conversation_id}/messages",
    status_code=status.HTTP_201_CREATED,
    summary="Envoyer un message et recevoir la réponse de l'assistant",
)
async def send_message(
    conversation_id: UUID,
    body: MessageCreate,
    owner: Owner = Depends(get_owner),
    db: AsyncSession = Depends(get_db_session),
):
    content = body.content.strip()
    if not content:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Le message est vide.")

    # Verrou sur la conversation : deux envois simultanés ne peuvent pas obtenir
    # le même sequence_no (contrainte uq_messages_conversation_sequence).
    conversation = await _owned_conversation(db, conversation_id, owner, lock=True)
    if conversation.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Cette conversation est archivée ou fermée.")

    if owner.is_visitor:
        usage = await session_usage(db, owner.visitor.id)
        if usage["user_messages"] >= settings.VISITOR_MAX_MESSAGES:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "Limite de messages de la session visiteur atteinte. "
                "Créez un compte pour continuer : votre historique sera conservé.",
            )

    memory = await build_memory(db, conversation.id)
    last_no = await db.scalar(
        select(func.max(Message.sequence_no)).where(Message.conversation_id == conversation.id)
    ) or 0

    user_message = Message(
        conversation_id=conversation.id, sequence_no=last_no + 1, sender_type="user", content=content
    )
    db.add(user_message)

    reply = await generate_reply(db, memory, content)
    assistant_message = Message(
        conversation_id=conversation.id,
        sequence_no=last_no + 2,
        sender_type="assistant",
        content=reply.content,
    )
    db.add(assistant_message)

    now = datetime.now(timezone.utc)
    conversation.last_message_at = now
    conversation.updated_at = now
    if last_no == 0 and (conversation.title or DEFAULT_TITLE) == DEFAULT_TITLE:
        conversation.title = content[:60] + ("…" if len(content) > 60 else "")
    await db.flush()

    return {
        "conversation": _conversation_dict(conversation),
        "user_message": _message_dict(user_message),
        "assistant_message": _message_dict(assistant_message),
        "assistant": {
            "generator": reply.generator,
            "intent": reply.intent,
            "language_detected": reply.language_detected,
            "program_codes": reply.program_codes,
        },
    }
