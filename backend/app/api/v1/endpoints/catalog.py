"""
SmartCampus AI — Catalogue académique et tarifs (SA-19 / SA-20 / SA-21).

Lecture publique : formations, détail (conditions d'admission, frais publiés,
débouchés), établissements, frais publiés.
Écriture : responsable académique (limité à SON établissement) ou administrateur.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import RoleChecker, UserRole
from app.database.connection import get_db_session
from app.models.catalog import AcademicInstitution, AcademicProgram, ProgramFee
from app.models.responsible_assignments import ResponsibleAssignment

router = APIRouter()
catalog_editor = Depends(RoleChecker([UserRole.RESPONSABLE, UserRole.ADMIN]))


class ProgramCreate(BaseModel):
    institution_id: int = Field(gt=0)
    program_code: str = Field(min_length=1, max_length=50)
    program_name: str = Field(min_length=1, max_length=255)
    program_type: str = Field(min_length=1, max_length=50)
    program_domain: str | None = Field(default=None, max_length=100)
    teaching_language: str | None = Field(default=None, max_length=50)
    program_duration: str | None = Field(default=None, max_length=100)
    total_credits: int | None = Field(default=None, ge=0)
    program_description: str | None = None


class ProgramPatch(BaseModel):
    program_name: str | None = Field(default=None, min_length=1, max_length=255)
    program_type: str | None = Field(default=None, min_length=1, max_length=50)
    program_domain: str | None = Field(default=None, max_length=100)
    teaching_language: str | None = Field(default=None, max_length=50)
    program_duration: str | None = Field(default=None, max_length=100)
    total_credits: int | None = Field(default=None, ge=0)
    program_description: str | None = None


def _fee_dict(f: ProgramFee) -> dict:
    return {
        "id": f.id,
        "program_id": f.program_id,
        "category": f.fee_category,
        "amount": str(f.fee_amount) if f.fee_amount is not None else None,
        "currency": f.fee_currency,
        "period": f.fee_period,
        "academic_year": f.fee_academic_year,
        "status": f.fee_status,
        "notes": f.fee_notes,
    }


def _program_dict(p: AcademicProgram) -> dict:
    return {
        "id": p.id,
        "institution_id": p.institution_id,
        "institution_code": p.institution.institution_code if p.institution else None,
        "institution_name": p.institution.institution_name if p.institution else None,
        "program_code": p.program_code,
        "program_name": p.program_name,
        "program_type": p.program_type,
        "program_domain": p.program_domain,
        "teaching_language": p.teaching_language,
        "program_duration": p.program_duration,
        "total_credits": p.total_credits,
        "program_description": p.program_description,
    }


def _is_published(fee: ProgramFee) -> bool:
    return (fee.fee_status or "").lower() == "published"


async def _assert_can_edit(db: AsyncSession, payload: dict, institution_id: int) -> None:
    """Un responsable académique ne modifie que le catalogue de son établissement."""
    if payload["role"] == UserRole.ADMIN.value:
        return
    assigned = await db.scalar(
        select(ResponsibleAssignment.institution_id).where(
            ResponsibleAssignment.user_id == payload["user"].id,
            ResponsibleAssignment.ended_at.is_(None),
        )
    )
    if assigned != institution_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Vous ne pouvez modifier que les formations de votre établissement.",
        )


# ------------------------------------------------------------------ lecture publique


@router.get("/institutions", summary="Établissements")
async def list_institutions(db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(AcademicInstitution, func.count(AcademicProgram.id))
        .outerjoin(AcademicProgram, AcademicProgram.institution_id == AcademicInstitution.id)
        .group_by(AcademicInstitution.id)
        .order_by(AcademicInstitution.institution_code)
    )).all()
    return [{
        "id": i.id,
        "institution_code": i.institution_code,
        "institution_name": i.institution_name,
        "program_count": n,
    } for i, n in rows]


@router.get("/programs", summary="Lister les formations")
async def list_programs(
    institution: str | None = Query(default=None, description="IIT ou ISB"),
    program_type: str | None = Query(default=None, max_length=50),
    search: str | None = Query(default=None, max_length=120),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(AcademicProgram)
        .join(AcademicInstitution, AcademicProgram.institution_id == AcademicInstitution.id)
        .options(selectinload(AcademicProgram.institution), selectinload(AcademicProgram.fees))
    )
    if institution:
        stmt = stmt.where(AcademicInstitution.institution_code == institution.strip().upper())
    if program_type:
        stmt = stmt.where(func.lower(AcademicProgram.program_type) == program_type.strip().lower())
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(or_(
            AcademicProgram.program_name.ilike(pattern),
            AcademicProgram.program_code.ilike(pattern),
            AcademicProgram.program_domain.ilike(pattern),
        ))
    programs = (await db.scalars(stmt.order_by(AcademicInstitution.institution_code, AcademicProgram.program_name))).all()
    result = []
    for p in programs:
        tuition = next((f for f in p.fees if _is_published(f) and f.fee_category.lower().startswith("frais de scolarit")), None)
        result.append({**_program_dict(p), "tuition": _fee_dict(tuition) if tuition else None})
    return result


@router.get("/programs/{program_id}", summary="Détail d'une formation")
async def get_program(program_id: int, db: AsyncSession = Depends(get_db_session)):
    program = await db.scalar(
        select(AcademicProgram)
        .where(AcademicProgram.id == program_id)
        .options(
            selectinload(AcademicProgram.institution),
            selectinload(AcademicProgram.admission_requirements),
            selectinload(AcademicProgram.fees),
            selectinload(AcademicProgram.careers),
        )
    )
    if program is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Formation introuvable.")
    return {
        **_program_dict(program),
        "admission_requirements": [{
            "required_diploma": r.required_diploma,
            "admission_process": r.admission_process,
            "required_documents": r.required_documents,
            "additional_conditions": r.additional_conditions,
        } for r in program.admission_requirements],
        "fees": [_fee_dict(f) for f in program.fees if _is_published(f)],
        "careers": [{
            "id": c.id, "job_title": c.career_job_title, "industry": c.career_industry,
        } for c in program.careers],
    }


@router.get("/fees", summary="Frais publiés")
async def list_fees(
    program_id: int | None = None,
    institution: str | None = Query(default=None, description="IIT ou ISB"),
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(ProgramFee).where(func.lower(ProgramFee.fee_status) == "published")
    if program_id is not None:
        stmt = stmt.where(ProgramFee.program_id == program_id)
    if institution:
        stmt = (
            stmt.join(AcademicProgram, ProgramFee.program_id == AcademicProgram.id)
            .join(AcademicInstitution, AcademicProgram.institution_id == AcademicInstitution.id)
            .where(AcademicInstitution.institution_code == institution.strip().upper())
        )
    rows = (await db.scalars(stmt.order_by(ProgramFee.program_id, ProgramFee.fee_category))).all()
    return [_fee_dict(f) for f in rows]


# ------------------------------------------------------------------ écriture protégée


@router.post("/programs", status_code=status.HTTP_201_CREATED, summary="Créer une formation")
async def create_program(
    body: ProgramCreate,
    payload: dict = catalog_editor,
    db: AsyncSession = Depends(get_db_session),
):
    institution = await db.get(AcademicInstitution, body.institution_id)
    if institution is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Établissement introuvable.")
    await _assert_can_edit(db, payload, institution.id)
    code = body.program_code.strip().upper()
    if await db.scalar(select(AcademicProgram.id).where(func.upper(AcademicProgram.program_code) == code)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ce code de formation existe déjà.")
    program = AcademicProgram(**{**body.model_dump(), "program_code": code})
    db.add(program)
    await db.flush()
    program.institution = institution
    return _program_dict(program)


@router.patch("/programs/{program_id}", summary="Modifier une formation")
async def update_program(
    program_id: int,
    body: ProgramPatch,
    payload: dict = catalog_editor,
    db: AsyncSession = Depends(get_db_session),
):
    program = await db.scalar(
        select(AcademicProgram).where(AcademicProgram.id == program_id)
        .options(selectinload(AcademicProgram.institution))
    )
    if program is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Formation introuvable.")
    await _assert_can_edit(db, payload, program.institution_id)
    values = body.model_dump(exclude_unset=True)
    if any(values.get(k) is None for k in ("program_name", "program_type") if k in values):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Le nom et le type ne peuvent pas être vides.")
    for key, value in values.items():
        setattr(program, key, value)
    await db.flush()
    return _program_dict(program)


@router.delete("/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Supprimer une formation")
async def delete_program(
    program_id: int,
    payload: dict = catalog_editor,
    db: AsyncSession = Depends(get_db_session),
):
    program = await db.get(AcademicProgram, program_id)
    if program is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Formation introuvable.")
    await _assert_can_edit(db, payload, program.institution_id)
    try:
        async with db.begin_nested():
            await db.delete(program)
            await db.flush()
    except IntegrityError:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Formation référencée (frais, conditions, dossiers…) : suppression impossible.",
        )
    return None
