"""SQLAlchemy model for appointment cancellation/rescheduling requests."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class AppointmentChangeRequest(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "appointment_change_requests"

    appointment_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("appointments.id", name="fk_appointment_change_requests_appointment", ondelete="RESTRICT"),
        nullable=False,
    )
    requested_by_user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", name="fk_appointment_change_requests_requester", ondelete="RESTRICT"),
        nullable=False,
    )
    request_type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default=text("'pending'")
    )
    proposed_slots: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    handled_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", name="fk_appointment_change_requests_handler", ondelete="RESTRICT"),
        nullable=True,
    )
    handled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "request_type IN ('reschedule', 'cancel')",
            name="ck_appointment_change_requests_type",
        ),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected', 'withdrawn')",
            name="ck_appointment_change_requests_status",
        ),
        CheckConstraint(
            "(status = 'pending' AND handled_by_user_id IS NULL AND handled_at IS NULL) OR "
            "(status <> 'pending' AND handled_by_user_id IS NOT NULL AND handled_at IS NOT NULL)",
            name="ck_appointment_change_requests_handling_metadata",
        ),
        CheckConstraint(
            "request_type <> 'reschedule' OR "
            "(proposed_slots IS NOT NULL AND jsonb_typeof(proposed_slots) = 'array' "
            "AND jsonb_array_length(proposed_slots) > 0)",
            name="ck_appointment_change_requests_reschedule_slots",
        ),
        Index("ix_appointment_change_requests_appointment", "appointment_id"),
        Index("ix_appointment_change_requests_status", "status"),
        Index("ix_appointment_change_requests_requester", "requested_by_user_id"),
    )

    appointment: Mapped["Appointment"] = relationship("Appointment")
    requested_by: Mapped["UserAccount"] = relationship(
        "UserAccount", foreign_keys=[requested_by_user_id]
    )
    handled_by: Mapped["UserAccount | None"] = relationship(
        "UserAccount", foreign_keys=[handled_by_user_id]
    )


from app.models.appointments import Appointment  # noqa: E402,F401
from app.models.accounts import UserAccount  # noqa: E402,F401
