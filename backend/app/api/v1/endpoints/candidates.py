from uuid import UUID
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_user_payload, RoleChecker, UserRole
from app.database.connection import get_db_session
from app.models.candidates import CandidateProfile, CandidateAcademicProfile, CandidateEducation

router = APIRouter()


class CandidateProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=32)
    current_level: str | None = Field(default=None, max_length=80)
    current_institution_name: str | None = Field(default=None, max_length=255)


def _profile_payload(profile: CandidateProfile) -> dict:
    academic = profile.academic_profile
    return {
        "user_id": str(profile.user_id),
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "phone": profile.phone,
        "academic_profile": ({
            "current_level": academic.current_level,
            "current_institution_name": academic.current_institution_name,
            "grade_average": str(academic.grade_average) if academic.grade_average is not None else None,
            "grade_scale": str(academic.grade_scale) if academic.grade_scale is not None else None,
        } if academic else None),
        "educations": [{
            "id": str(item.id), "institution_name": item.institution_name,
            "qualification": item.qualification, "field_of_study": item.field_of_study,
            "start_year": item.start_year, "completion_year": item.completion_year,
        } for item in profile.educations],
    }


@router.get("/me", summary="Consulter son propre profil candidat")
async def get_my_profile(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    if payload["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Cette ressource est réservée aux candidats.")
    profile = await db.scalar(
        select(CandidateProfile)
        .options(selectinload(CandidateProfile.academic_profile), selectinload(CandidateProfile.educations))
        .where(CandidateProfile.user_id == payload["user"].id)
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Profil candidat introuvable.")
    return _profile_payload(profile)


@router.put("/me", summary="Modifier son propre profil candidat")
async def update_my_profile(
    body: CandidateProfileUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    if payload["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Cette ressource est réservée aux candidats.")
    profile = await db.get(CandidateProfile, payload["user"].id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profil candidat introuvable.")
    values = body.model_dump(exclude_unset=True)
    if any(values.get(key) is None for key in ("first_name", "last_name") if key in values):
        raise HTTPException(status_code=422, detail="Le prénom et le nom ne peuvent pas être nuls.")
    academic_values = {k: values.pop(k) for k in ("current_level", "current_institution_name") if k in values}
    for key, value in values.items():
        setattr(profile, key, value)
    if academic_values:
        academic = await db.get(CandidateAcademicProfile, profile.user_id)
        if academic is None:
            academic = CandidateAcademicProfile(candidate_id=profile.user_id)
            db.add(academic)
        for key, value in academic_values.items():
            setattr(academic, key, value)
    await db.flush()
    return {"message": "Profil mis à jour.", "user_id": str(profile.user_id)}


@router.get("/", summary="Lister les candidats",
            dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE, UserRole.ADMIN]))])
async def list_candidates(db: AsyncSession = Depends(get_db_session)):
    rows = (await db.scalars(
        select(CandidateProfile).options(selectinload(CandidateProfile.academic_profile))
        .order_by(CandidateProfile.last_name, CandidateProfile.first_name)
    )).all()
    return [{
        "user_id": str(p.user_id), "first_name": p.first_name,
        "last_name": p.last_name, "phone": p.phone,
    } for p in rows]


@router.get("/{candidate_id}", summary="Consulter un candidat",
            dependencies=[Depends(RoleChecker([UserRole.RESPONSABLE, UserRole.ADMIN]))])
async def get_candidate(candidate_id: str, db: AsyncSession = Depends(get_db_session)):
    try:
        candidate_uuid = UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Candidat introuvable.")
    profile = await db.scalar(
        select(CandidateProfile)
        .options(selectinload(CandidateProfile.academic_profile), selectinload(CandidateProfile.educations))
        .where(CandidateProfile.user_id == candidate_uuid)
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Candidat introuvable.")
    return _profile_payload(profile)
