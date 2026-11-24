"""SQLAlchemy models for versioned required-document checklists."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class DocumentRequirementSet(UUIDMixin, TimestampMixin, Base):
    """A versioned platform-wide checklist of required documents."""

    __tablename__ = "document_requirement_sets"

    version: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        default="Liste globale des documents obligatoires",
        server_default=text("'Liste globale des documents obligatoires'"),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_document_requirement_sets_created_by",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("version", name="uq_document_requirement_sets_version"),
        CheckConstraint("version > 0", name="ck_document_requirement_sets_positive_version"),
        CheckConstraint(
            "(is_active = false AND activated_at IS NULL) OR "
            "(is_active = true AND activated_at IS NOT NULL)",
            name="ck_document_requirement_sets_activation",
        ),
        Index(
            "uq_document_requirement_sets_one_active",
            "is_active",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
    )

    created_by: Mapped["UserAccount"] = relationship(
        "UserAccount", foreign_keys=[created_by_user_id]
    )
    required_document_types: Mapped[list["RequiredDocumentType"]] = relationship(
        "RequiredDocumentType",
        back_populates="requirement_set",
        cascade="all, delete-orphan",
        order_by="RequiredDocumentType.display_order",
    )


class RequiredDocumentType(UUIDMixin, TimestampMixin, Base):
    """A required document entry belonging to one checklist version."""

    __tablename__ = "required_document_types"

    requirement_set_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "document_requirement_sets.id",
            name="fk_required_document_types_requirement_set",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(60), nullable=False)
    label: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_mandatory: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    allowed_mime_types: Mapped[str | None] = mapped_column(String(500), nullable=True)
    max_file_size_mb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )

    __table_args__ = (
        UniqueConstraint(
            "requirement_set_id", "code",
            name="uq_required_document_types_set_code",
        ),
        # Composite-FK target used by candidate_documents.
        UniqueConstraint(
            "id", "requirement_set_id",
            name="uq_required_document_types_id_requirement_set",
        ),
        CheckConstraint("display_order >= 0", name="ck_required_document_types_order"),
        CheckConstraint(
            "max_file_size_mb IS NULL OR max_file_size_mb > 0",
            name="ck_required_document_types_max_size",
        ),
        Index("ix_required_document_types_requirement_set_id", "requirement_set_id"),
        Index(
            "ix_required_document_types_set_active_order",
            "requirement_set_id", "is_active", "display_order",
        ),
    )

    requirement_set: Mapped["DocumentRequirementSet"] = relationship(
        "DocumentRequirementSet", back_populates="required_document_types"
    )


from app.models.accounts import UserAccount  # noqa: E402,F401
