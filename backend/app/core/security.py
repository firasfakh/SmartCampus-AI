"""
SmartCampus AI — Sécurité (SA-28).

- Hachage des mots de passe (bcrypt via passlib).
- JWT d'accès signés (HS256) : `sub` = identifiant du compte, `role` = rôle.
- Le rôle est TOUJOURS relu en base à chaque requête : un compte désactivé ou
  dont le rôle a changé ne garde pas d'anciens droits jusqu'à l'expiration du JWT.
- Contrôle d'accès par rôle (RoleChecker).
- Sessions visiteurs anonymes transmises par l'en-tête `X-Visitor-Token` (SA-25).
"""

import re
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.connection import get_db_session
from app.models.accounts import UserAccount

# ============================================================
# MOTS DE PASSE
# ============================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt ignore tout ce qui dépasse 72 octets : on refuse plutôt que de tronquer en silence.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    """Hacher un mot de passe."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier un mot de passe (False si le hash est invalide)."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError):
        return False


def password_policy_error(password: str) -> Optional[str]:
    """Retourner un message d'erreur si le mot de passe est trop faible, sinon None."""
    if len(password) < 8:
        return "Le mot de passe doit contenir au moins 8 caractères."
    if len(password.encode("utf-8")) > _BCRYPT_MAX_BYTES:
        return "Le mot de passe ne doit pas dépasser 72 octets."
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return "Le mot de passe doit contenir au moins une lettre et un chiffre."
    return None


# ============================================================
# JWT
# ============================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Créer un JWT signé contenant `data` et une date d'expiration."""
    payload = data.copy()
    now = datetime.now(timezone.utc)
    payload["iat"] = now
    payload["exp"] = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Décoder et vérifier un JWT (signature + expiration)."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================
# RÔLES
# ============================================================

class UserRole(str, Enum):
    """Rôles applicatifs. Les valeurs correspondent à la contrainte ck_user_accounts_role."""

    VISITOR = "visitor"  # rôle logique (pas de compte en base)
    CANDIDATE = "candidate"
    RESPONSABLE = "responsable_academique"
    RESPONSABLE_ENTRETIEN = "responsable_entretien"
    DIRECTION = "direction"
    ADMIN = "admin"


INTERNAL_ROLES = {
    UserRole.RESPONSABLE.value,
    UserRole.RESPONSABLE_ENTRETIEN.value,
    UserRole.DIRECTION.value,
    UserRole.ADMIN.value,
}

# ============================================================
# UTILISATEUR CONNECTÉ
# ============================================================

bearer_scheme = HTTPBearer(auto_error=False)


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> Optional[dict]:
    """
    Retourner l'utilisateur connecté si un Bearer token est fourni, sinon None.

    Un token fourni mais invalide/expiré provoque un 401 : le frontend doit alors
    supprimer son token et repasser en mode visiteur.
    """
    if credentials is None:
        return None

    payload = decode_access_token(credentials.credentials)
    try:
        user_id = UUID(str(payload.get("sub")))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant utilisateur invalide.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.scalar(select(UserAccount).where(UserAccount.id == user_id))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compte inexistant ou désactivé.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Le rôle vient de la base, jamais du token.
    return {"sub": str(user.id), "role": user.role, "email": user.email, "user": user}


async def get_current_user_payload(
    payload: Optional[dict] = Depends(get_optional_current_user),
) -> dict:
    """Exiger une authentification valide."""
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


class RoleChecker:
    """Dépendance FastAPI : autoriser uniquement certains rôles.

    Exemple : `dependencies=[Depends(RoleChecker([UserRole.ADMIN]))]`
    """

    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = {role.value for role in allowed_roles}

    async def __call__(self, payload: dict = Depends(get_current_user_payload)) -> dict:
        if payload.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes pour cette action.",
            )
        return payload


# ============================================================
# SESSIONS VISITEURS (SA-25)
# ============================================================

async def get_visitor_session(
    x_visitor_token: Optional[str] = Header(default=None, alias="X-Visitor-Token"),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Session visiteur active correspondant à `X-Visitor-Token`, ou None.

    Un jeton absent, inconnu, expiré, révoqué ou déjà rattaché renvoie None :
    il ne doit jamais bloquer un utilisateur authentifié.
    """
    if not x_visitor_token:
        return None

    from app.services.visitor_sessions import find_active_session

    try:
        return await find_active_session(db, x_visitor_token)
    except HTTPException:
        return None


async def require_visitor_session(session=Depends(get_visitor_session)):
    """Exiger une session visiteur valide (sinon 401 explicite)."""
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session visiteur absente, invalide ou expirée.",
        )
    return session
