"""
SmartCampus AI — Fondations de sécurité.

Hashage des mots de passe, génération et vérification des tokens JWT,
et dépendances FastAPI pour l'authentification et le contrôle d'accès.
"""

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# --- Hashage des mots de passe ---

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hasher un mot de passe en clair."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier un mot de passe en clair contre son hash."""
    return pwd_context.verify(plain_password, hashed_password)


# --- Gestion des tokens JWT ---

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Créer un token JWT.

    Args:
        data: Données à encoder dans le token (doit contenir 'sub' pour l'identifiant).
        expires_delta: Durée de validité personnalisée.

    Returns:
        Le token JWT encodé.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Décoder et valider un token JWT.

    Args:
        token: Le token JWT à décoder.

    Returns:
        Les données décodées du token.

    Raises:
        HTTPException: Si le token est invalide ou expiré.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# --- Rôles utilisateur (conformes à SA-3) ---


class UserRole(str, Enum):
    """
    Rôles utilisateur définis dans SA-3.

    - VISITOR: Visiteur sans compte (accès public uniquement).
    - CANDIDATE: Candidat identifié.
    - RESPONSABLE: Responsable administratif.
    """

    VISITOR = "visitor"
    CANDIDATE = "candidate"
    RESPONSABLE = "responsable"


# --- Dépendances d'authentification ---


async def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Récupérer les données de l'utilisateur connecté depuis le token JWT.

    Cette dépendance sera enrichie une fois les modèles User implémentés
    pour retourner l'objet utilisateur complet depuis la base de données.
    """
    payload = decode_access_token(token)
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide : identifiant utilisateur manquant.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


class RoleChecker:
    """
    Vérificateur de rôle pour le contrôle d'accès.

    Utilisation dans les endpoints:
        @router.get("/admin", dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE]))])
    """

    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    async def __call__(self, payload: dict = Depends(get_current_user_payload)):
        user_role = payload.get("role")
        if user_role not in [role.value for role in self.allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé : permissions insuffisantes.",
            )
        return payload
