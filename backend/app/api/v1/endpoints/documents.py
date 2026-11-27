import hashlib
import os
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user_payload
from app.database.connection import get_db_session
from app.models.candidate_documents import CandidateDocument
from app.models.pre_registrations import PreRegistration
from app.models.required_document_types import RequiredDocumentType

router = APIRouter()
DEFAULT_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}


async def _owned_dossier(db: AsyncSession, dossier_id: UUID, payload: dict):
    dossier = await db.get(PreRegistration, dossier_id)
    if dossier is None:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    if payload["role"] == "candidate" and dossier.candidate_id != payload["user"].id:
        raise HTTPException(status_code=404, detail="Dossier introuvable.")
    if payload["role"] not in ("candidate", "responsable_academique", "admin", "direction"):
        raise HTTPException(status_code=403, detail="Accès refusé.")
    return dossier


def _document_payload(doc: CandidateDocument):
    return {
        "id": str(doc.id), "pre_registration_id": str(doc.pre_registration_id),
        "required_document_type_id": str(doc.required_document_type_id),
        "original_filename": doc.original_filename, "mime_type": doc.mime_type,
        "file_size_bytes": doc.file_size_bytes, "checksum_sha256": doc.checksum_sha256,
        "status": doc.status, "uploaded_at": doc.uploaded_at,
        "review_comment": doc.review_comment,
    }


@router.post("/", status_code=status.HTTP_201_CREATED, summary="Téléverser une pièce justificative")
async def upload_document(
    pre_registration_id: UUID = Form(...),
    required_document_type_id: UUID = Form(...),
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    dossier = await _owned_dossier(db, pre_registration_id, payload)
    if payload["role"] != "candidate" or dossier.status != "draft":
        raise HTTPException(status_code=403, detail="Le téléversement est réservé au candidat propriétaire d'un dossier brouillon.")
    requirement = await db.get(RequiredDocumentType, required_document_type_id)
    if requirement is None or requirement.requirement_set_id != dossier.document_requirement_set_id or not requirement.is_active:
        raise HTTPException(status_code=422, detail="Type de document non valide pour ce dossier.")
    mime = (file.content_type or "").lower()
    allowed = set(requirement.allowed_mime_types.split(",")) if requirement.allowed_mime_types else DEFAULT_MIME_TYPES
    allowed = {item.strip().lower() for item in allowed if item.strip()}
    if mime not in allowed:
        raise HTTPException(status_code=415, detail="Format de fichier non autorisé.")
    max_mb = min(settings.MAX_UPLOAD_SIZE_MB, requirement.max_file_size_mb or settings.MAX_UPLOAD_SIZE_MB)
    content = await file.read(max_mb * 1024 * 1024 + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Le fichier est vide.")
    if len(content) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Taille maximale autorisée : {max_mb} Mo.")
    storage_dir = Path(settings.UPLOAD_DIR).resolve()
    storage_dir.mkdir(parents=True, exist_ok=True)
    storage_key = f"{uuid4().hex}"
    target = storage_dir / storage_key
    target.write_bytes(content)
    checksum = hashlib.sha256(content).hexdigest()
    existing = await db.scalar(select(CandidateDocument).where(
        CandidateDocument.pre_registration_id == dossier.id,
        CandidateDocument.required_document_type_id == requirement.id,
    ))
    if existing:
        old_key = existing.storage_key
        existing.storage_key = storage_key
        existing.original_filename = Path(file.filename or "document").name[:255]
        existing.mime_type = mime
        existing.file_size_bytes = len(content)
        existing.checksum_sha256 = checksum
        existing.status = "pending"
        existing.reviewed_by_user_id = None
        existing.reviewed_at = None
        existing.review_comment = None
        await db.flush()
        # Old file cleanup is best-effort; the DB now points to the new object.
        try:
            (storage_dir / old_key).unlink(missing_ok=True)
        except OSError:
            pass
        return _document_payload(existing)
    document = CandidateDocument(
        pre_registration_id=dossier.id,
        requirement_set_id=dossier.document_requirement_set_id,
        required_document_type_id=requirement.id,
        storage_key=storage_key,
        original_filename=Path(file.filename or "document").name[:255],
        mime_type=mime,
        file_size_bytes=len(content),
        checksum_sha256=checksum,
        status="pending",
    )
    db.add(document)
    await db.flush()
    return _document_payload(document)


@router.get("/{document_id}", summary="Consulter les métadonnées d'une pièce")
async def get_document(
    document_id: UUID,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    doc = await db.get(CandidateDocument, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    await _owned_dossier(db, doc.pre_registration_id, payload)
    return _document_payload(doc)


@router.get("/{document_id}/download", summary="Télécharger une pièce")
async def download_document(
    document_id: UUID,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    doc = await db.get(CandidateDocument, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    await _owned_dossier(db, doc.pre_registration_id, payload)
    path = (Path(settings.UPLOAD_DIR).resolve() / doc.storage_key).resolve()
    if path.parent != Path(settings.UPLOAD_DIR).resolve() or not path.is_file():
        raise HTTPException(status_code=404, detail="Fichier physique introuvable.")
    return FileResponse(path, media_type=doc.mime_type, filename=doc.original_filename)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Supprimer une pièce")
async def delete_document(
    document_id: UUID,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db_session),
):
    doc = await db.get(CandidateDocument, document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    dossier = await _owned_dossier(db, doc.pre_registration_id, payload)
    if payload["role"] != "candidate" or dossier.status != "draft":
        raise HTTPException(status_code=403, detail="Suppression réservée au candidat propriétaire d'un dossier brouillon.")
    path = Path(settings.UPLOAD_DIR).resolve() / doc.storage_key
    await db.delete(doc)
    await db.flush()
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass
    return None
