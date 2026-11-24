"""SQLAlchemy model for appointment records."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
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


class Appointment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "appointments"

    pre_registration_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "pre_registrations.id",
            name="fk_appointments_dossier",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    proposal_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "appointment_proposals.id",
            name="fk_appointments_proposal",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )
    scheduled_by_user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_appointments_scheduled_by",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="proposed",
        server_default=text("'proposed'"),
    )
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meeting_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("ends_at > starts_at", name="ck_appointments_valid_time_range"),
        CheckConstraint(
            "status IN ('proposed', 'confirmed', 'cancelled', 'completed', 'no_show')",
            name="ck_appointments_status",
        ),
        CheckConstraint(
            "(status IN ('confirmed', 'completed', 'no_show') "
            "AND confirmed_at IS NOT NULL) OR "
            "(status IN ('proposed', 'cancelled') AND confirmed_at IS NULL)",
            name="ck_appointments_confirmation_metadata",
        ),
        CheckConstraint(
            "(status = 'cancelled' AND cancelled_at IS NOT NULL) OR "
            "(status <> 'cancelled' AND cancelled_at IS NULL)",
            name="ck_appointments_cancellation_metadata",
        ),
        # Required as the target of the composite FK from interviews.
        UniqueConstraint(
            "id", "pre_registration_id",
            name="uq_appointments_id_pre_registration",
        ),
        Index("ix_appointments_dossier", "pre_registration_id"),
        Index("ix_appointments_starts_at", "starts_at"),
        Index("ix_appointments_status_starts_at", "status", "starts_at"),
        Index("ix_appointments_scheduled_by", "scheduled_by_user_id"),
        Index(
            "uq_appointments_one_confirmed_per_dossier",
            "pre_registration_id",
            unique=True,
            postgresql_where=text("status = 'confirmed'"),
        ),
    )

    pre_registration: Mapped["PreRegistration"] = relationship("PreRegistration")
    proposal: Mapped["AppointmentProposal | None"] = relationship("AppointmentProposal")
    scheduled_by: Mapped["UserAccount"] = relationship(
        "UserAccount", foreign_keys=[scheduled_by_user_id]
    )


from app.models.pre_registrations import PreRegistration  # noqa: E402,F401
from app.models.appointment_proposals import AppointmentProposal  # noqa: E402,F401
from app.models.accounts import UserAccount  # noqa: E402,F401
