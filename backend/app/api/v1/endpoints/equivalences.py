"""
SmartCampus AI — Endpoints de gestion des demandes d'équivalence.

Création, consultation, modification et traitement
des demandes d'équivalence.
"""

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload, RoleChecker, UserRole

router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Créer une demande d'équivalence",
)
async def create_equivalence_request(
    payload: dict = Depends(get_current_user_payload),
):
    """
    Créer une nouvelle demande d'équivalence.

    Accessible aux candidats authentifiés.
    """
    # TODO: Implémenter la création de demande (SA-5)
    return {"message": "Création de demande d'équivalence — à implémenter."}


@router.get(
    "/",
    summary="Consulter les demandes d'équivalence",
)
async def list_equivalence_requests(
    payload: dict = Depends(get_current_user_payload),
):
    """
    Consulter les demandes d'équivalence.

    Un candidat voit uniquement ses propres demandes.
    Un responsable voit les demandes selon ses autorisations.
    """
    # TODO: Implémenter la liste des demandes (SA-5)
    return {"message": "Liste des demandes d'équivalence — à implémenter."}


@router.get(
    "/{request_id}",
    summary="Consulter une demande d'équivalence",
)
async def get_equivalence_request(
    request_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Consulter le détail d'une demande d'équivalence.

    Accessible au candidat propriétaire ou aux responsables autorisés.
    """
    # TODO: Implémenter la consultation de demande (SA-5)
    return {"message": f"Demande d'équivalence {request_id} — à implémenter."}


@router.put(
    "/{request_id}",
    summary="Modifier une demande d'équivalence",
)
async def update_equivalence_request(
    request_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Modifier une demande d'équivalence.

    Accessible au candidat propriétaire tant que la demande n'est pas traitée.
    """
    # TODO: Implémenter la modification de demande (SA-5)
    return {"message": f"Modification de la demande {request_id} — à implémenter."}


@router.post(
    "/{request_id}/supplement",
    summary="Demander un complément d'information",
    dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))],
)
async def request_supplement(request_id: str):
    """
    Demander un complément d'information sur une demande d'équivalence.

    Accessible uniquement aux responsables.
    """
    # TODO: Implémenter la demande de complément (SA-5)
    return {"message": f"Demande de complément pour {request_id} — à implémenter."}


@router.post(
    "/{request_id}/decision",
    summary="Enregistrer une décision",
    dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))],
)
async def record_decision(request_id: str):
    """
    Enregistrer une décision sur une demande d'équivalence.

    Accessible uniquement aux responsables.
    """
    # TODO: Implémenter l'enregistrement de décision (SA-5)
    return {"message": f"Décision pour {request_id} — à implémenter."}
