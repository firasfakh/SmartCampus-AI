"""
SmartCampus AI — Endpoints de gestion des candidats.

Consultation et modification des profils candidats
selon les règles d'accès définies dans SA-5.
"""

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload, RoleChecker, UserRole

router = APIRouter()


@router.get(
    "/me",
    summary="Consulter son propre profil candidat",
)
async def get_my_profile(payload: dict = Depends(get_current_user_payload)):
    """
    Récupérer le profil du candidat connecté.

    Accessible uniquement au candidat lui-même.
    """
    # TODO: Implémenter la consultation du profil (SA-5)
    return {"message": "Profil candidat — à implémenter."}


@router.put(
    "/me",
    summary="Modifier son propre profil candidat",
)
async def update_my_profile(payload: dict = Depends(get_current_user_payload)):
    """
    Modifier les informations du profil du candidat connecté.

    Accessible uniquement au candidat lui-même.
    """
    # TODO: Implémenter la modification du profil (SA-5)
    return {"message": "Modification du profil — à implémenter."}


@router.get(
    "/",
    summary="Lister les candidats",
    dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))],
)
async def list_candidates():
    """
    Consulter la liste des candidats.

    Accessible uniquement aux responsables.
    """
    # TODO: Implémenter la liste des candidats (SA-5)
    return {"message": "Liste des candidats — à implémenter."}


@router.get(
    "/{candidate_id}",
    summary="Consulter un candidat",
    dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))],
)
async def get_candidate(candidate_id: str):
    """
    Consulter le profil d'un candidat spécifique.

    Accessible uniquement aux responsables.
    """
    # TODO: Implémenter la consultation d'un candidat (SA-5)
    return {"message": f"Candidat {candidate_id} — à implémenter."}
