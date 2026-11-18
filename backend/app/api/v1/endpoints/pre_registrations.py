"""
SmartCampus AI — Endpoints de gestion des préinscriptions.

Création, consultation, modification, soumission
et mise à jour du statut des dossiers de préinscription.
"""

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload, RoleChecker, UserRole

router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Créer une préinscription",
)
async def create_pre_registration(
    payload: dict = Depends(get_current_user_payload),
):
    """
    Créer un nouveau dossier de préinscription.

    Accessible aux candidats authentifiés.
    """
    # TODO: Implémenter la création de préinscription (SA-5)
    return {"message": "Création de préinscription — à implémenter."}


@router.get(
    "/{registration_id}",
    summary="Consulter un dossier de préinscription",
)
async def get_pre_registration(
    registration_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Consulter le détail d'un dossier de préinscription.

    Un candidat ne peut consulter que son propre dossier.
    Un responsable peut consulter selon ses autorisations.
    """
    # TODO: Implémenter la consultation de préinscription (SA-5)
    return {"message": f"Préinscription {registration_id} — à implémenter."}


@router.put(
    "/{registration_id}",
    summary="Modifier un dossier de préinscription",
)
async def update_pre_registration(
    registration_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Modifier les informations d'un dossier de préinscription.

    Accessible au candidat propriétaire tant que le dossier n'est pas soumis.
    """
    # TODO: Implémenter la modification de préinscription (SA-5)
    return {"message": f"Modification de la préinscription {registration_id} — à implémenter."}


@router.post(
    "/{registration_id}/submit",
    summary="Soumettre un dossier de préinscription",
)
async def submit_pre_registration(
    registration_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Soumettre un dossier de préinscription pour traitement.

    Accessible uniquement au candidat propriétaire.
    Le dossier ne peut plus être modifié après soumission.
    """
    # TODO: Implémenter la soumission de préinscription (SA-5)
    return {"message": f"Soumission de la préinscription {registration_id} — à implémenter."}


@router.patch(
    "/{registration_id}/status",
    summary="Mettre à jour le statut d'un dossier",
    dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))],
)
async def update_pre_registration_status(registration_id: str):
    """
    Mettre à jour le statut d'un dossier de préinscription.

    Accessible uniquement aux responsables.
    """
    # TODO: Implémenter la mise à jour de statut (SA-5)
    return {"message": f"Mise à jour du statut de {registration_id} — à implémenter."}
