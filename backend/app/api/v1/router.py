"""
SmartCampus AI — Routeur principal API v1.

Agrège tous les routeurs des domaines fonctionnels définis dans SA-5.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    candidates,
    conversations,
    documents,
    equivalences,
    pre_registrations,
    appointments,
    interviews,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentification"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["Candidats"])
api_router.include_router(
    conversations.router, prefix="/conversations", tags=["Conversations"]
)
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(
    equivalences.router, prefix="/equivalences", tags=["Demandes d'équivalence"]
)
api_router.include_router(
    pre_registrations.router,
    prefix="/pre-registrations",
    tags=["Préinscriptions"],
)
api_router.include_router(
    appointments.router, prefix="/appointments", tags=["Rendez-vous"]
)
api_router.include_router(
    interviews.router, prefix="/interviews", tags=["Entretiens"]
)
