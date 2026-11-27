"""
SmartCampus AI — Authentification et gestion des rôles (SA-27 / SA-28).

Règles :
- l'inscription publique crée UNIQUEMENT un compte `candidate` (le client ne
  choisit jamais son rôle) ;
- les comptes internes (responsables, direction, admin) sont créés par un admin ;
- un responsable (académique ou entretien) est rattaché à UN établissement
  (IIT ou ISB) via `responsible_assignments` : c'est ce qui distingue
  « responsable académique IIT » et « responsable académique ISB » ;
- les e-mails sont stockés en minuscules (index unique sur lower(email)).
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    INTERNAL_ROLES,
    RoleChecker,
    UserRole,
    create_access_token,
    get_current_user_payload,
    hash_password,
    password_policy_error,
    verify_password,
)
from app.database.connection import get_db_session
from app.models.accounts import UserAccount
from app.models.candidates import CandidateProfile
from app.models.catalog import AcademicInstitution
from app.models.responsible_assignments import RESPONSIBLE_ROLES, ResponsibleAssignment

router = APIRouter()
admin_only = Depends(RoleChecker([UserRole.ADMIN]))

# ------------------------------------------------------------------ schémas


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    # `username` est conservé pour compatibilité avec le frontend existant.
    username: EmailStr
    password: str = Field(min_length=1, max_length=128)


class InternalAccountCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    role: str
    institution_code: str | None = Field(
        default=None, description="Obligatoire pour un responsable : IIT ou ISB."
    )


class RoleUpdate(BaseModel):
    role: str
    institution_code: str | None = None


class StatusUpdate(BaseModel):
    is_active: bool


# ------------------------------------------------------------------ helpers


def _check_password(password: str) -> None:
    error = password_policy_error(password)
    if error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, error)


async def _email_taken(db: AsyncSession, email: str) -> bool:
    return bool(await db.scalar(select(UserAccount.id).where(func.lower(UserAccount.email) == email)))


async def _current_assignment(db: AsyncSession, user_id: UUID) -> ResponsibleAssignment | None:
    return await db.scalar(
        select(ResponsibleAssignment).where(
            ResponsibleAssignment.user_id == user_id, ResponsibleAssignment.ended_at.is_(None)
        )
    )


async def _institution_code(db: AsyncSession, user: UserAccount) -> str | None:
    if user.role not in RESPONSIBLE_ROLES:
        return None
    return await db.scalar(
        select(AcademicInstitution.institution_code)
        .join(ResponsibleAssignment, ResponsibleAssignment.institution_id == AcademicInstitution.id)
        .where(ResponsibleAssignment.user_id == user.id, ResponsibleAssignment.ended_at.is_(None))
    )


async def _get_institution(db: AsyncSession, code: str | None) -> AcademicInstitution:
    if not code:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Un responsable doit être rattaché à un établissement (institution_code : IIT ou ISB).",
        )
    institution = await db.scalar(
        select(AcademicInstitution).where(AcademicInstitution.institution_code == code.strip().upper())
    )
    if institution is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Établissement introuvable.")
    return institution


async def _user_dict(db: AsyncSession, user: UserAccount) -> dict:
    profile = await db.get(CandidateProfile, user.id) if user.role == "candidate" else None
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "institution_code": await _institution_code(db, user),
        "first_name": profile.first_name if profile else "",
        "last_name": profile.last_name if profile else "",
        "phone": profile.phone if profile else None,
        "created_at": user.created_at,
    }


def _token_response(user: UserAccount, user_data: dict) -> dict:
    return {
        "access_token": create_access_token({"sub": str(user.id), "role": user.role}),
        "token_type": "bearer",
        "user": user_data,
    }


# ------------------------------------------------------------------ routes publiques


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Inscription candidat")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db_session)):
    _check_password(body.password)
    email = body.email.strip().lower()
    if await _email_taken(db, email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Cette adresse e-mail est déjà utilisée.")

    user = UserAccount(email=email, password_hash=hash_password(body.password), role="candidate")
    db.add(user)
    await db.flush()
    db.add(CandidateProfile(
        user_id=user.id,
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        phone=(body.phone or "").strip() or None,
    ))
    await db.flush()
    return _token_response(user, await _user_dict(db, user))


@router.post("/login", summary="Connexion (e-mail + mot de passe)")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    email = body.username.strip().lower()
    user = await db.scalar(select(UserAccount).where(func.lower(UserAccount.email) == email))
    # Même message que le compte existe ou non : on ne révèle pas les e-mails enregistrés.
    if user is None or not verify_password(body.password, user.password_hash) or not user.is_active:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Adresse e-mail ou mot de passe incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _token_response(user, await _user_dict(db, user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Déconnexion")
async def logout(_: dict = Depends(get_current_user_payload)):
    # JWT sans état : le client supprime son token. Une révocation immédiate côté
    # serveur nécessiterait une liste noire (hors périmètre SA-28).
    return None


@router.get("/me", summary="Mon compte")
async def get_current_user(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    data = await _user_dict(db, payload["user"])
    # Champ historique conservé pour compatibilité.
    data["user_id"] = data["id"]
    return data


# ------------------------------------------------------------------ administration


@router.get("/users", dependencies=[admin_only], summary="Lister les comptes (admin)")
async def list_users(
    role: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(UserAccount).order_by(UserAccount.created_at.desc())
    if role:
        stmt = stmt.where(UserAccount.role == role)
    return [await _user_dict(db, u) for u in (await db.scalars(stmt)).all()]


@router.post(
    "/users", status_code=status.HTTP_201_CREATED, summary="Créer un compte interne (admin)"
)
async def create_internal_account(
    body: InternalAccountCreate,
    admin: dict = admin_only,
    db: AsyncSession = Depends(get_db_session),
):
    role = body.role.strip()
    if role not in INTERNAL_ROLES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Rôle interne non autorisé.")
    _check_password(body.password)
    email = body.email.strip().lower()
    if await _email_taken(db, email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Cette adresse e-mail est déjà utilisée.")

    institution = await _get_institution(db, body.institution_code) if role in RESPONSIBLE_ROLES else None
    user = UserAccount(
        email=email,
        password_hash=hash_password(body.password),
        role=role,
        created_by_user_id=admin["user"].id,
    )
    db.add(user)
    await db.flush()
    if institution is not None:
        db.add(ResponsibleAssignment(
            user_id=user.id, institution_id=institution.id, role=role,
            assigned_by_user_id=admin["user"].id,
        ))
        await db.flush()
    return await _user_dict(db, user)


@router.patch("/users/{user_id}/role", summary="Modifier le rôle d'un compte interne (admin)")
async def update_account_role(
    user_id: UUID,
    body: RoleUpdate,
    admin: dict = admin_only,
    db: AsyncSession = Depends(get_db_session),
):
    if body.role not in INTERNAL_ROLES | {"candidate"}:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Rôle non autorisé.")
    user = await db.get(UserAccount, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Compte introuvable.")
    if (user.role == "candidate") != (body.role == "candidate"):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Un compte candidat ne peut pas devenir interne (et inversement) : créez un compte dédié.",
        )
    if user.id == admin["user"].id and body.role != "admin":
        raise HTTPException(status.HTTP_409_CONFLICT, "Un administrateur ne peut pas retirer son propre rôle.")

    now = datetime.now(timezone.utc)
    current = await _current_assignment(db, user.id)
    new_institution = await _get_institution(db, body.institution_code) if body.role in RESPONSIBLE_ROLES else None

    needs_new_assignment = new_institution is not None and (
        current is None or current.institution_id != new_institution.id or current.role != body.role
    )
    if current is not None and (new_institution is None or needs_new_assignment):
        current.ended_at = now
        current.ended_by_user_id = admin["user"].id
        current.end_reason = f"Changement de rôle vers {body.role}"
        await db.flush()
    if needs_new_assignment:
        db.add(ResponsibleAssignment(
            user_id=user.id, institution_id=new_institution.id, role=body.role,
            assigned_by_user_id=admin["user"].id,
        ))
    user.role = body.role
    await db.flush()
    return await _user_dict(db, user)


@router.patch("/users/{user_id}/status", summary="Activer / désactiver un compte (admin)")
async def update_account_status(
    user_id: UUID,
    body: StatusUpdate,
    admin: dict = admin_only,
    db: AsyncSession = Depends(get_db_session),
):
    user = await db.get(UserAccount, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Compte introuvable.")
    if user.id == admin["user"].id and not body.is_active:
        raise HTTPException(status.HTTP_409_CONFLICT, "Vous ne pouvez pas désactiver votre propre compte.")
    user.is_active = body.is_active
    # Contrainte ck_user_accounts_deactivation_consistency.
    user.disabled_at = None if body.is_active else datetime.now(timezone.utc)
    user.disabled_by_user_id = None if body.is_active else admin["user"].id
    await db.flush()
    return await _user_dict(db, user)
