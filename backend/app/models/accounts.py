"""SQLAlchemy model for SA-13 user accounts."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    Boolean,
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


USER_ROLES = (
    "admin",
    "responsable_academique",
    "responsable_entretien",
    "candidate",
    "direction",
)


class UserAccount(UUIDMixin, TimestampMixin, Base):
    """Platform account for candidates and internal users."""

    __tablename__ = "user_accounts"

    email: Mapped[str] = mapped_column(String(320), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("TRUE"),
    )

    created_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_user_accounts_created_by",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )
    disabled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    disabled_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_user_accounts_disabled_by",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "role IN "
            "('admin', 'responsable_academique', "
            "'responsable_entretien', 'candidate', 'direction')",
            name="ck_user_accounts_role",
        ),
        CheckConstraint(
            "(is_active = TRUE AND disabled_at IS NULL "
            "AND disabled_by_user_id IS NULL) OR "
            "(is_active = FALSE AND disabled_at IS NOT NULL "
            "AND disabled_by_user_id IS NOT NULL)",
            name="ck_user_accounts_deactivation_consistency",
        ),
        Index(
            "uq_user_accounts_email_lower",
            text("lower(email)"),
            unique=True,
        ),
        Index(
            "ix_user_accounts_role_is_active",
            "role",
            "is_active",
        ),
    )

    created_by: Mapped[UserAccount | None] = relationship(
        "UserAccount",
        remote_side="UserAccount.id",
        foreign_keys=[created_by_user_id],
        back_populates="created_accounts",
    )
    created_accounts: Mapped[list[UserAccount]] = relationship(
        "UserAccount",
        foreign_keys=[created_by_user_id],
        back_populates="created_by",
    )

    disabled_by: Mapped[UserAccount | None] = relationship(
        "UserAccount",
        remote_side="UserAccount.id",
        foreign_keys=[disabled_by_user_id],
        back_populates="disabled_accounts",
    )
    disabled_accounts: Mapped[list[UserAccount]] = relationship(
        "UserAccount",
        foreign_keys=[disabled_by_user_id],
        back_populates="disabled_by",
    )

    candidate_profile: Mapped["CandidateProfile | None"] = relationship(
        "CandidateProfile",
        back_populates="user",
        uselist=False,
    )
