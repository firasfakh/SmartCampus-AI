import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class PreRegistration(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "pre_registrations"

    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidate_profiles.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    program_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("academic_programs.id", ondelete="RESTRICT"),
        nullable=False,
    )
    document_requirement_set_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_requirement_sets.id", ondelete="RESTRICT"),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, server_default=text("'draft'")
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    treatment_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_accounts.id", ondelete="RESTRICT"), nullable=True
    )
    decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    previous_pre_registration_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pre_registrations.id", ondelete="RESTRICT"), nullable=True
    )
    reapplication_authorized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reapplication_authorized_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_accounts.id", ondelete="RESTRICT"), nullable=True
    )
    reapplication_authorization_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    candidate = relationship("CandidateProfile", back_populates="pre_registrations")
    program = relationship("AcademicProgram")
    document_requirement_set = relationship("DocumentRequirementSet")
    decision_by = relationship("UserAccount", foreign_keys=[decision_by_user_id])
    reapplication_authorized_by = relationship(
        "UserAccount", foreign_keys=[reapplication_authorized_by_user_id]
    )
    previous_pre_registration = relationship(
        "PreRegistration", remote_side="PreRegistration.id",
        foreign_keys=[previous_pre_registration_id],
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'submitted', 'needs_info', 'under_review', "
            "'accepted', 'rejected', 'withdrawn')",
            name="ck_pre_registrations_status",
        ),
        CheckConstraint(
            "(status IN ('accepted', 'rejected') AND decision_at IS NOT NULL "
            "AND decision_by_user_id IS NOT NULL) OR "
            "(status NOT IN ('accepted', 'rejected') AND decision_at IS NULL "
            "AND decision_by_user_id IS NULL)",
            name="ck_pre_registrations_decision_metadata",
        ),
        CheckConstraint(
            "status <> 'rejected' OR "
            "(decision_reason IS NOT NULL AND length(trim(decision_reason)) > 0)",
            name="ck_pre_registrations_rejection_reason",
        ),
        CheckConstraint(
            "(previous_pre_registration_id IS NULL AND reapplication_authorized_at IS NULL "
            "AND reapplication_authorized_by_user_id IS NULL "
            "AND reapplication_authorization_reason IS NULL) OR "
            "(previous_pre_registration_id IS NOT NULL AND reapplication_authorized_at IS NOT NULL "
            "AND reapplication_authorized_by_user_id IS NOT NULL "
            "AND reapplication_authorization_reason IS NOT NULL "
            "AND length(trim(reapplication_authorization_reason)) > 0)",
            name="ck_pre_registrations_reapplication_authorization",
        ),
        CheckConstraint(
            "previous_pre_registration_id IS NULL OR previous_pre_registration_id <> id",
            name="ck_pre_registrations_not_own_previous",
        ),
        UniqueConstraint(
            "id", "document_requirement_set_id",
            name="uq_pre_registrations_id_document_requirement_set",
        ),
        Index(
            "uq_pre_registrations_one_active_per_candidate",
            "candidate_id", unique=True,
            postgresql_where=text("status NOT IN ('accepted', 'rejected', 'withdrawn')"),
        ),
        Index("ix_pre_registrations_program_id", "program_id"),
        Index("ix_pre_registrations_status", "status"),
        Index("ix_pre_registrations_candidate_id", "candidate_id"),
    )
