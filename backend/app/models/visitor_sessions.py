"""SQLAlchemy model for anonymous visitor sessions."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class VisitorSession(UUIDMixin, TimestampMixin, Base):
    """Anonymous visitor session that can later be claimed by a candidate."""

    __tablename__ = "visitor_sessions"

    # Store only a hash of the bearer token, never the raw token.
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    is_claimed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("FALSE"),
    )
    claimed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    claimed_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_visitor_sessions_claimed_by_user",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        Index(
            "uq_visitor_sessions_token_hash",
            "token_hash",
            unique=True,
        ),
        Index(
            "ix_visitor_sessions_expires_at",
            "expires_at",
        ),
        Index(
            "ix_visitor_sessions_claimed_by_user",
            "claimed_by_user_id",
        ),
    )

    claimed_by: Mapped["UserAccount | None"] = relationship(
        "UserAccount",
        foreign_keys=[claimed_by_user_id],
    )


# Import the mapped class so SQLAlchemy can resolve the relationship target.
from app.models.accounts import UserAccount  # noqa: E402,F401
