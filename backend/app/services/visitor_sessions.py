"""
SmartCampus AI — Service des sessions visiteurs (SA-25) et rattachement (SA-29).

Principe de sécurité :
- le jeton visiteur est une valeur aléatoire de 48 octets renvoyée UNE SEULE FOIS
  au navigateur ; seule son empreinte SHA-256 est stockée en base ;
- une session expire après VISITOR_SESSION_TTL_HOURS ;
- après rattachement à un compte, la session est révoquée : l'ancien jeton ne
  donne plus accès aux conversations, devenues celles du candidat.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.conversations import Conversation
from app.models.messages import Message
from app.models.visitor_sessions import VisitorSession


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


async def create_visitor_session(db: AsyncSession) -> tuple[VisitorSession, str]:
    """Créer une session visiteur ; retourne (session, jeton brut à transmettre au client)."""
    raw_token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    session = VisitorSession(
        token_hash=_hash_token(raw_token),
        started_at=now,
        last_seen_at=now,
        expires_at=now + timedelta(hours=settings.VISITOR_SESSION_TTL_HOURS),
    )
    db.add(session)
    await db.flush()
    return session, raw_token


async def find_active_session(db: AsyncSession, raw_token: str) -> VisitorSession:
    """Retrouver une session utilisable à partir du jeton brut, sinon 401."""
    if not raw_token or len(raw_token) > 256:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session visiteur invalide ou expirée.")
    session = await db.scalar(
        select(VisitorSession).where(VisitorSession.token_hash == _hash_token(raw_token))
    )
    now = datetime.now(timezone.utc)
    if (
        session is None
        or session.revoked_at is not None
        or session.is_claimed
        or _utc(session.expires_at) <= now
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session visiteur invalide ou expirée.")
    session.last_seen_at = now
    return session


async def session_usage(db: AsyncSession, session_id: UUID) -> dict:
    """Nombre de conversations et de messages utilisateur d'une session visiteur."""
    conversations = await db.scalar(
        select(func.count(Conversation.id)).where(Conversation.visitor_session_id == session_id)
    ) or 0
    user_messages = await db.scalar(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.visitor_session_id == session_id, Message.sender_type == "user")
    ) or 0
    return {
        "conversations": conversations,
        "user_messages": user_messages,
        "max_conversations": settings.VISITOR_MAX_CONVERSATIONS,
        "max_user_messages": settings.VISITOR_MAX_MESSAGES,
    }


async def claim_visitor_session(
    db: AsyncSession, session: VisitorSession, user_id: UUID, consent: bool
) -> list[UUID]:
    """
    SA-29 — Rattacher les conversations d'une session visiteur à un compte candidat.

    Retourne la liste des conversations transférées. Opération atomique :
    la ligne de session est verrouillée (SELECT ... FOR UPDATE) pour empêcher
    deux rattachements concurrents.
    """
    if not consent:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Le consentement explicite du candidat est requis pour rattacher l'historique.",
        )

    locked = await db.scalar(
        select(VisitorSession).where(VisitorSession.id == session.id).with_for_update()
    )
    if locked is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session visiteur introuvable.")
    if locked.is_claimed:
        raise HTTPException(status.HTTP_409_CONFLICT, "Cette session a déjà été rattachée.")

    now = datetime.now(timezone.utc)
    transferred = (await db.scalars(
        update(Conversation)
        .where(Conversation.visitor_session_id == locked.id, Conversation.user_id.is_(None))
        .values(user_id=user_id, updated_at=now)
        .returning(Conversation.id)
    )).all()

    locked.is_claimed = True
    locked.claimed_at = now
    locked.claimed_by_user_id = user_id
    # L'ancien jeton ne doit plus permettre de lire des conversations devenues privées.
    locked.revoked_at = now
    await db.flush()
    return list(transferred)


async def cleanup_expired_visitor_memory(db: AsyncSession) -> int:
    """
    SA-26 — Purger la mémoire temporaire : messages, conversations et sessions
    visiteurs expirées et jamais rattachées. Retourne le nombre de sessions supprimées.
    """
    now = datetime.now(timezone.utc)
    expired_ids = select(VisitorSession.id).where(
        VisitorSession.expires_at <= now,
        VisitorSession.is_claimed.is_(False),
    )
    orphan_conversations = select(Conversation.id).where(
        Conversation.visitor_session_id.in_(expired_ids),
        Conversation.user_id.is_(None),
    )
    await db.execute(delete(Message).where(Message.conversation_id.in_(orphan_conversations)))
    await db.execute(
        delete(Conversation).where(
            Conversation.visitor_session_id.in_(expired_ids),
            Conversation.user_id.is_(None),
        )
    )
    result = await db.execute(
        delete(VisitorSession).where(
            VisitorSession.id.in_(expired_ids),
            VisitorSession.is_claimed.is_(False),
        )
    )
    return result.rowcount or 0
