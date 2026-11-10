"""
SmartCampus AI — Endpoints de gestion des entretiens.

Création, consultation, observations et résultats
des entretiens.
"""

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload, RoleChecker, UserRole

router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Créer un entretien",
    dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))],
)
async def create_interview():
    """
    Créer un nouvel entretien.

    Accessible uniquement aux responsables.
    """
    # TODO: Implémenter la création d'entretien (SA-5)
    return {"message": "Création d'entretien — à implémenter."}


@router.get(
    "/",
    summary="Consulter les entretiens",
)
async def list_interviews(payload: dict = Depends(get_current_user_payload)):
    """
    Consulter les entretiens autorisés.

    Un candidat voit ses propres entretiens.
    Un responsable voit les entretiens selon ses autorisations.
    """
    # TODO: Implémenter la liste des entretiens (SA-5)
    return {"message": "Liste des entretiens — à implémenter."}


@router.get(
    "/{interview_id}",
    summary="Consulter un entretien",
)
async def get_interview(
    interview_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Consulter le détail d'un entretien.

    Accessible au candidat concerné ou aux responsables autorisés.
    """
    # TODO: Implémenter la consultation d'un entretien (SA-5)
    return {"message": f"Entretien {interview_id} — à implémenter."}


@router.post(
    "/{interview_id}/observations",
    summary="Enregistrer des observations",
    dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))],
)
async def record_observations(interview_id: str):
    """
    Enregistrer les observations d'un entretien.

    Accessible uniquement aux responsables.
    """
    # TODO: Implémenter l'enregistrement des observations (SA-5)
    return {"message": f"Observations pour {interview_id} — à implémenter."}


@router.patch(
    "/{interview_id}/result",
    summary="Mettre à jour le résultat d'un entretien",
    dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))],
)
async def update_interview_result(interview_id: str):
    """
    Mettre à jour le résultat final d'un entretien.

    Accessible uniquement aux responsables.
    """
    # TODO: Implémenter la mise à jour du résultat (SA-5)
    return {"message": f"Résultat de l'entretien {interview_id} — à implémenter."}
