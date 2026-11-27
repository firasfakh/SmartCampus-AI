"""
SmartCampus AI — Sessions visiteurs (SA-25) et rattachement (SA-29).

Flux côté frontend :
1. `POST /sessions/visitor` → le navigateur stocke `session_token`
   et l'envoie ensuite dans l'en-tête `X-Visitor-Token`.
2. Le visiteur discute avec l'assistant (routes /conversations).
3. Il crée un compte ou se connecte, puis accepte le rattachement :
   `POST /sessions/visitor/claim` avec Bearer JWT + X-Visitor-Token + {"consent": true}.
4. Les conversations deviennent celles du candidat ; le jeton visiteur est révoqué.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_payload, require_visitor_session
from app.database.connection import get_db_session
from app.models.visitor_sessions import VisitorSession
from app.services.visitor_sessions import (
    claim_visitor_session,
    create_visitor_session,
    session_usage,
)

router = APIRouter()


class ClaimRequest(BaseModel):
    consent: bool


@router.post("/visitor", status_code=status.HTTP_201_CREATED, summary="Créer une session visiteur")
async def create_visitor(db: AsyncSession = Depends(get_db_session)):
    session, token = await create_visitor_session(db)
    return {
        "session_id": str(session.id),
        # Le jeton brut n'est renvoyé qu'une seule fois : seul son SHA-256 est stocké.
        "session_token": token,
        "expires_at": session.expires_at,
        "is_claimed": False,
    }


@router.get("/visitor/me", summary="État de ma session visiteur")
async def get_visitor(
    session: VisitorSession = Depends(require_visitor_session),
    db: AsyncSession = Depends(get_db_session),
):
    return {
        "session_id": str(session.id),
        "started_at": session.started_at,
        "expires_at": session.expires_at,
        "is_claimed": session.is_claimed,
        "usage": await session_usage(db, session.id),
    }


@router.post("/visitor/claim", summary="Rattacher l'historique visiteur à mon compte candidat")
async def claim_visitor(
    body: ClaimRequest,
    user_payload: dict = Depends(get_current_user_payload),
    session: VisitorSession = Depends(require_visitor_session),
    db: AsyncSession = Depends(get_db_session),
):
    if user_payload["role"] != "candidate":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Seul un compte candidat peut rattacher un historique de conversation.",
        )
    transferred = await claim_visitor_session(db, session, user_payload["user"].id, body.consent)
    return {
        "claimed": True,
        "transferred_conversations": len(transferred),
        "conversation_ids": [str(cid) for cid in transferred],
    }
