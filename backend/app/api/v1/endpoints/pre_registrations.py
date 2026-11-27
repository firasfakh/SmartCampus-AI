from datetime import datetime, timezone
from uuid import UUID
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_payload, RoleChecker, UserRole
from app.database.connection import get_db_session
from app.models.pre_registrations import PreRegistration
from app.models.catalog import AcademicProgram
from app.models.required_document_types import DocumentRequirementSet

router = APIRouter()


class PreRegistrationCreate(BaseModel):
    program_id: int = Field(gt=0)
    document_requirement_set_id: UUID


class PreRegistrationUpdate(BaseModel):
    program_id: int | None = Field(default=None, gt=0)
    document_requirement_set_id: UUID | None = None


class StatusUpdate(BaseModel):
    status: str
    reason: str | None = Field(default=None, max_length=2000)


def _serialize(row: PreRegistration) -> dict:
    return {
        "id": str(row.id), "candidate_id": str(row.candidate_id),
        "program_id": row.program_id,
        "document_requirement_set_id": str(row.document_requirement_set_id),
        "status": row.status, "submitted_at": row.submitted_at,
        "treatment_started_at": row.treatment_started_at,
        "decision_at": row.decision_at,
        "decision_by_user_id": str(row.decision_by_user_id) if row.decision_by_user_id else None,
        "decision_reason": row.decision_reason,
    }


async def _get_owned_registration(db, registration_id: str, payload: dict):
    try:
        reg_uuid = UUID(registration_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    row = await db.get(PreRegistration, reg_uuid)
    if row is None:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    if payload["role"] == "candidate" and row.candidate_id != payload["user"].id:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    if payload["role"] not in ("candidate", "responsable_academique", "admin", "direction"):
        raise HTTPException(status_code=403, detail="Accès refusé.")
    return row


@router.post("/", status_code=status.HTTP_201_CREATED, summary="Créer une préinscription")
async def create_pre_registration(
    body: PreRegistrationCreate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    if payload["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Seul un candidat peut créer un dossier.")
    if await db.get(AcademicProgram, body.program_id) is None:
        raise HTTPException(status_code=404, detail="Formation introuvable.")
    if await db.get(DocumentRequirementSet, body.document_requirement_set_id) is None:
        raise HTTPException(status_code=404, detail="Référentiel de pièces introuvable.")
    row = PreRegistration(
        candidate_id=payload["user"].id,
        program_id=body.program_id,
        document_requirement_set_id=body.document_requirement_set_id,
        status="draft",
    )
    db.add(row)
    await db.flush()
    return _serialize(row)


@router.get("/{registration_id}", summary="Consulter un dossier de préinscription")
async def get_pre_registration(
    registration_id: str,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    return _serialize(await _get_owned_registration(db, registration_id, payload))


@router.put("/{registration_id}", summary="Modifier un dossier de préinscription")
async def update_pre_registration(
    registration_id: str,
    body: PreRegistrationUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    row = await _get_owned_registration(db, registration_id, payload)
    if payload["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Modification réservée au candidat propriétaire.")
    if row.status != "draft":
        raise HTTPException(status_code=409, detail="Seul un dossier brouillon peut être modifié.")
    values = body.model_dump(exclude_unset=True)
    if any(value is None for value in values.values()):
        raise HTTPException(status_code=422, detail="Les champs de rattachement ne peuvent pas être nuls.")
    if "program_id" in values and await db.get(AcademicProgram, values["program_id"]) is None:
        raise HTTPException(status_code=404, detail="Formation introuvable.")
    if "document_requirement_set_id" in values and await db.get(DocumentRequirementSet, values["document_requirement_set_id"]) is None:
        raise HTTPException(status_code=404, detail="Référentiel de pièces introuvable.")
    for key, value in values.items():
        setattr(row, key, value)
    await db.flush()
    return _serialize(row)


@router.post("/{registration_id}/submit", summary="Soumettre un dossier de préinscription")
async def submit_pre_registration(
    registration_id: str,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    row = await _get_owned_registration(db, registration_id, payload)
    if payload["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Soumission réservée au candidat propriétaire.")
    if row.status != "draft":
        raise HTTPException(status_code=409, detail="Ce dossier ne peut plus être soumis.")
    row.status = "submitted"
    row.submitted_at = datetime.now(timezone.utc)
    await db.flush()
    return _serialize(row)


@router.patch("/{registration_id}/status", summary="Mettre à jour le statut d'un dossier",
              dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE, UserRole.ADMIN]))])
async def update_pre_registration_status(
    registration_id: str,
    body: StatusUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    allowed = {"needs_info", "under_review", "accepted", "rejected", "withdrawn"}
    if body.status not in allowed:
        raise HTTPException(status_code=422, detail="Statut non autorisé.")
    row = await _get_owned_registration(db, registration_id, payload)
    if row.status in ("accepted", "rejected", "withdrawn"):
        raise HTTPException(status_code=409, detail="Le dossier est dans un état terminal.")
    now = datetime.now(timezone.utc)
    row.status = body.status
    if body.status == "under_review" and row.treatment_started_at is None:
        row.treatment_started_at = now
    if body.status in ("accepted", "rejected"):
        if body.status == "rejected" and not (body.reason and body.reason.strip()):
            raise HTTPException(status_code=422, detail="Un motif est obligatoire pour un refus.")
        row.decision_at = now
        row.decision_by_user_id = payload["user"].id
        row.decision_reason = body.reason.strip() if body.reason else None
    await db.flush()
    return _serialize(row)
