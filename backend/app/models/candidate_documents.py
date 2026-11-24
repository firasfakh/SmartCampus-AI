"""SQLAlchemy model for documents submitted with a pre-registration."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class CandidateDocument(UUIDMixin, TimestampMixin, Base):
    """One replaceable document slot for a required document in a dossier."""

    __tablename__ = "candidate_documents"

    pre_registration_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    requirement_set_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    required_document_type_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )

    # Private storage metadata. Replacing a file updates this same row.
    storage_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(150), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending",
        server_default=text("'pending'"),
    )
    reviewed_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_candidate_documents_reviewed_by",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        # A dossier can have only one current file for a given document type.
        UniqueConstraint(
            "pre_registration_id", "required_document_type_id",
            name="uq_candidate_documents_dossier_required_type",
        ),
        # The selected type must belong to the same requirement-set version
        # referenced by the dossier.
        ForeignKeyConstraint(
            ["pre_registration_id", "requirement_set_id"],
            ["pre_registrations.id", "pre_registrations.document_requirement_set_id"],
            name="fk_candidate_documents_dossier_requirement_set",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["required_document_type_id", "requirement_set_id"],
            ["required_document_types.id", "required_document_types.requirement_set_id"],
            name="fk_candidate_documents_type_requirement_set",
            ondelete="RESTRICT",
        ),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name="ck_candidate_documents_status",
        ),
        CheckConstraint(
            "file_size_bytes > 0",
            name="ck_candidate_documents_positive_file_size",
        ),
        CheckConstraint(
            "checksum_sha256 IS NULL OR "
            "checksum_sha256 ~ '^[0-9a-fA-F]{64}$'",
            name="ck_candidate_documents_checksum_sha256",
        ),
        CheckConstraint(
            "(status = 'pending' AND reviewed_by_user_id IS NULL "
            "AND reviewed_at IS NULL) OR "
            "(status IN ('accepted', 'rejected') "
            "AND reviewed_by_user_id IS NOT NULL "
            "AND reviewed_at IS NOT NULL)",
            name="ck_candidate_documents_review_metadata",
        ),
        CheckConstraint(
            "status <> 'rejected' OR "
            "(review_comment IS NOT NULL AND length(trim(review_comment)) > 0)",
            name="ck_candidate_documents_rejection_comment",
        ),
        Index("ix_candidate_documents_pre_registration_id", "pre_registration_id"),
        Index("ix_candidate_documents_required_type_id", "required_document_type_id"),
        Index("ix_candidate_documents_status", "status"),
        Index("ix_candidate_documents_reviewed_by_user_id", "reviewed_by_user_id"),
        Index("uq_candidate_documents_storage_key", "storage_key", unique=True),
    )

    pre_registration: Mapped["PreRegistration"] = relationship(
        "PreRegistration",
        foreign_keys=[pre_registration_id, requirement_set_id],
    )
    required_document_type: Mapped["RequiredDocumentType"] = relationship(
        "RequiredDocumentType",
        foreign_keys=[required_document_type_id, requirement_set_id],
    )
    reviewed_by: Mapped["UserAccount | None"] = relationship(
        "UserAccount", foreign_keys=[reviewed_by_user_id]
    )


from app.models.pre_registrations import PreRegistration  # noqa: E402,F401
from app.models.required_document_types import RequiredDocumentType  # noqa: E402,F401
from app.models.accounts import UserAccount  # noqa: E402,F401
