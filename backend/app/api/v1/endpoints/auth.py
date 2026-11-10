"""
SmartCampus AI — Endpoints d'authentification.

Gestion de l'inscription, la connexion, la déconnexion
et la récupération du profil utilisateur connecté.
"""

from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_payload

router = APIRouter()


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Inscription d'un nouvel utilisateur",
)
async def register():
    """
    Créer un nouveau compte utilisateur.

    Accessible aux visiteurs. Crée un compte avec le rôle candidat par défaut.
    """
    # TODO: Implémenter l'inscription (SA-5)
    return {"message": "Endpoint d'inscription — à implémenter."}


@router.post(
    "/login",
    summary="Connexion utilisateur",
)
async def login():
    """
    Authentifier un utilisateur et retourner un token JWT.

    Accessible aux visiteurs disposant d'un compte.
    """
    # TODO: Implémenter la connexion (SA-5)
    return {"message": "Endpoint de connexion — à implémenter."}


@router.post(
    "/logout",
    summary="Déconnexion utilisateur",
)
async def logout(payload: dict = Depends(get_current_user_payload)):
    """
    Déconnecter l'utilisateur courant.

    Nécessite une authentification.
    """
    # TODO: Implémenter la déconnexion (SA-5)
    return {"message": "Déconnexion effectuée."}


@router.get(
    "/me",
    summary="Profil de l'utilisateur connecté",
)
async def get_current_user(payload: dict = Depends(get_current_user_payload)):
    """
    Récupérer les informations de l'utilisateur actuellement connecté.

    Nécessite une authentification.
    """
    # TODO: Retourner les données complètes de l'utilisateur (SA-5)
    return {"user_id": payload.get("sub"), "role": payload.get("role")}
