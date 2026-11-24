"""SQLAlchemy model for interview attempts linked to a pre-registration dossier."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID as PyUUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class Interview(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "interviews"

    pre_registration_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "pre_registrations.id",
            name="fk_interviews_pre_registration",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    appointment_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        unique=True,
    )
    interviewer_user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_interviews_interviewer",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="completed",
        server_default=text("'completed'"),
    )
    score: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    appreciation: Mapped[str | None] = mapped_column(Text, nullable=True)
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(String(20), nullable=True)
    interviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        CheckConstraint(
            "attempt_number IN (1, 2)",
            name="ck_interviews_attempt_number",
        ),
        CheckConstraint(
            "status IN ('completed', 'no_show')",
            name="ck_interviews_status",
        ),
        CheckConstraint(
            "score IS NULL OR (score >= 0 AND score <= 20)",
            name="ck_interviews_score_range",
        ),
        CheckConstraint(
            "recommendation IS NULL OR "
            "recommendation IN ('favorable', 'unfavorable')",
            name="ck_interviews_recommendation",
        ),
        # A completed interview must have an outcome. A no-show has no result.
        CheckConstraint(
            "(status = 'no_show' AND score IS NULL AND recommendation IS NULL) "
            "OR (status = 'completed' AND recommendation IS NOT NULL)",
            name="ck_interviews_result_consistency",
        ),
        # Enforces that the appointment belongs to the same dossier.
        ForeignKeyConstraint(
            ["appointment_id", "pre_registration_id"],
            ["appointments.id", "appointments.pre_registration_id"],
            name="fk_interviews_appointment_same_dossier",
            ondelete="RESTRICT",
        ),
        UniqueConstraint(
            "pre_registration_id",
            "attempt_number",
            name="uq_interviews_dossier_attempt_number",
        ),
        Index("ix_interviews_pre_registration_id", "pre_registration_id"),
        Index("ix_interviews_interviewer", "interviewer_user_id"),
        Index("ix_interviews_status", "status"),
    )

    pre_registration: Mapped["PreRegistration"] = relationship(
        "PreRegistration",
        foreign_keys=[pre_registration_id],
    )
    appointment: Mapped["Appointment"] = relationship(
        "Appointment",
        foreign_keys=[appointment_id, pre_registration_id],
    )
    interviewer: Mapped["UserAccount"] = relationship(
        "UserAccount",
        foreign_keys=[interviewer_user_id],
    )


from app.models.pre_registrations import PreRegistration  # noqa: E402,F401
from app.models.appointments import Appointment  # noqa: E402,F401
from app.models.accounts import UserAccount  # noqa: E402,F401
