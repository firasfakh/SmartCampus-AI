"""SQLAlchemy model for appointment slot proposals and counter-proposals."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class AppointmentProposal(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "appointment_proposals"

    pre_registration_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pre_registrations.id", name="fk_appointment_proposals_dossier", ondelete="RESTRICT"),
        nullable=False,
    )
    proposed_by_user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", name="fk_appointment_proposals_proposer", ondelete="RESTRICT"),
        nullable=False,
    )
    proposal_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default=text("'pending'")
    )
    # Array of proposed date/time slots, stored as JSON objects in UTC.
    proposed_slots: Mapped[list] = mapped_column(JSONB, nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    responded_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", name="fk_appointment_proposals_responded_by", ondelete="RESTRICT"),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "proposal_type IN ('initial', 'alternative', 'reschedule')",
            name="ck_appointment_proposals_type",
        ),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')",
            name="ck_appointment_proposals_status",
        ),
        CheckConstraint("jsonb_typeof(proposed_slots) = 'array' AND jsonb_array_length(proposed_slots) > 0",
                        name="ck_appointment_proposals_nonempty_slots"),
        CheckConstraint(
            "(status = 'pending' AND responded_at IS NULL AND responded_by_user_id IS NULL) OR "
            "(status <> 'pending' AND responded_at IS NOT NULL AND responded_by_user_id IS NOT NULL)",
            name="ck_appointment_proposals_response_metadata",
        ),
        Index("ix_appointment_proposals_dossier", "pre_registration_id"),
        Index("ix_appointment_proposals_status_expiry", "status", "expires_at"),
        Index("ix_appointment_proposals_proposer", "proposed_by_user_id"),
    )

    pre_registration: Mapped["PreRegistration"] = relationship("PreRegistration")
    proposed_by: Mapped["UserAccount"] = relationship("UserAccount", foreign_keys=[proposed_by_user_id])
    responded_by: Mapped["UserAccount | None"] = relationship("UserAccount", foreign_keys=[responded_by_user_id])


from app.models.pre_registrations import PreRegistration  # noqa: E402,F401
from app.models.accounts import UserAccount  # noqa: E402,F401
