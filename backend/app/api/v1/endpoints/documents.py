"""
SmartCampus AI — Endpoints de gestion des documents.

Téléversement, consultation, téléchargement et suppression
de documents selon les autorisations.
"""

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload, RoleChecker, UserRole

router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Téléverser un document",
)
async def upload_document(payload: dict = Depends(get_current_user_payload)):
    """
    Téléverser un nouveau document.

    Accessible aux candidats pour leurs propres dossiers.
    """
    # TODO: Implémenter le téléversement de document (SA-5)
    return {"message": "Téléversement de document — à implémenter."}


@router.get(
    "/{document_id}",
    summary="Consulter les métadonnées d'un document",
)
async def get_document_metadata(
    document_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Consulter les métadonnées d'un document.

    Un candidat ne peut consulter que ses propres documents.
    Un responsable peut consulter les documents selon ses autorisations.
    """
    # TODO: Implémenter la consultation des métadonnées (SA-5)
    return {"message": f"Métadonnées du document {document_id} — à implémenter."}


@router.get(
    "/{document_id}/download",
    summary="Télécharger un document",
)
async def download_document(
    document_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Télécharger le fichier d'un document.

    Un candidat ne peut télécharger que ses propres documents.
    Un responsable peut télécharger les documents selon ses autorisations.
    """
    # TODO: Implémenter le téléchargement de document (SA-5)
    return {"message": f"Téléchargement du document {document_id} — à implémenter."}


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un document",
)
async def delete_document(
    document_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Supprimer un document.

    Un candidat ne peut supprimer que ses propres documents non soumis.
    Un responsable peut supprimer selon ses autorisations.
    """
    # TODO: Implémenter la suppression de document (SA-5)
    return None
