"""
SmartCampus AI — Endpoints de gestion des conversations.

Création, consultation et échange de messages
avec l'assistant IA.
"""

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload

router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Créer une conversation",
)
async def create_conversation(payload: dict = Depends(get_current_user_payload)):
    """
    Créer une nouvelle conversation avec l'assistant IA.

    Accessible aux candidats authentifiés.
    """
    # TODO: Implémenter la création de conversation (SA-5)
    return {"message": "Création de conversation — à implémenter."}


@router.get(
    "/",
    summary="Lister les conversations",
)
async def list_conversations(payload: dict = Depends(get_current_user_payload)):
    """
    Consulter les conversations de l'utilisateur connecté.

    Un candidat ne voit que ses propres conversations.
    Un responsable peut voir les conversations selon ses autorisations.
    """
    # TODO: Implémenter la liste des conversations (SA-5)
    return {"message": "Liste des conversations — à implémenter."}


@router.post(
    "/{conversation_id}/messages",
    status_code=status.HTTP_201_CREATED,
    summary="Envoyer un message",
)
async def send_message(
    conversation_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Envoyer un message dans une conversation.

    Accessible uniquement au propriétaire de la conversation.
    """
    # TODO: Implémenter l'envoi de message (SA-5)
    return {"message": "Envoi de message — à implémenter."}


@router.get(
    "/{conversation_id}/messages",
    summary="Historique des messages",
)
async def get_messages(
    conversation_id: str,
    payload: dict = Depends(get_current_user_payload),
):
    """
    Récupérer l'historique des messages d'une conversation.

    Accessible uniquement au propriétaire de la conversation.
    """
    # TODO: Implémenter l'historique des messages (SA-5)
    return {"message": "Historique des messages — à implémenter."}
