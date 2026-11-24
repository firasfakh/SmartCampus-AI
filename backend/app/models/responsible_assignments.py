"""SQLAlchemy model for SA-13 responsible assignments."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


RESPONSIBLE_ROLES = (
    "responsable_academique",
    "responsable_entretien",
)


class ResponsibleAssignment(UUIDMixin, TimestampMixin, Base):
    """Historical assignment of a responsible user to an institution."""

    __tablename__ = "responsible_assignments"

    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_responsible_assignments_user",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    institution_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "academic_institutions.id",
            name="fk_responsible_assignments_institution",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    assigned_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_responsible_assignments_assigned_by",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    ended_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_responsible_assignments_ended_by",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )
    end_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "role IN ('responsable_academique', 'responsable_entretien')",
            name="ck_responsible_assignments_role",
        ),
        CheckConstraint(
            "ended_at IS NULL OR ended_at >= assigned_at",
            name="ck_responsible_assignments_end_after_start",
        ),
        CheckConstraint(
            "(ended_at IS NULL AND ended_by_user_id IS NULL) OR "
            "(ended_at IS NOT NULL AND ended_by_user_id IS NOT NULL)",
            name="ck_responsible_assignments_end_consistency",
        ),
        # A responsible account can have only one current assignment.
        # Previous assignments remain in the table for history.
        Index(
            "uq_responsible_assignments_one_current_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("ended_at IS NULL"),
        ),
        Index(
            "ix_responsible_assignments_institution_role_active",
            "institution_id",
            "role",
            postgresql_where=text("ended_at IS NULL"),
        ),
        Index(
            "ix_responsible_assignments_assigned_by",
            "assigned_by_user_id",
        ),
    )

    user: Mapped["UserAccount"] = relationship(
        "UserAccount",
        foreign_keys=[user_id],
    )
    institution: Mapped["AcademicInstitution"] = relationship(
        "AcademicInstitution",
        foreign_keys=[institution_id],
    )
    assigned_by: Mapped["UserAccount | None"] = relationship(
        "UserAccount",
        foreign_keys=[assigned_by_user_id],
    )
    ended_by: Mapped["UserAccount | None"] = relationship(
        "UserAccount",
        foreign_keys=[ended_by_user_id],
    )


# Import mapped classes so SQLAlchemy can resolve string-based relationships.
from app.models.accounts import UserAccount  # noqa: E402,F401
from app.models.catalog import AcademicInstitution  # noqa: E402,F401
