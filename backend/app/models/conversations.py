"""SQLAlchemy model for candidate and anonymous visitor conversations."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
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


class Conversation(UUIDMixin, TimestampMixin, Base):
    """Conversation owned by a visitor session, a candidate, or both after claiming."""

    __tablename__ = "conversations"

    # NULL while the conversation is anonymous; populated after registration
    # transfers the visitor's conversations to the candidate.
    user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "user_accounts.id",
            name="fk_conversations_user",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    # Retained after claiming as provenance of the original anonymous session.
    visitor_session_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "visitor_sessions.id",
            name="fk_conversations_visitor_session",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active",
        server_default=text("'active'"),
    )
    last_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "user_id IS NOT NULL OR visitor_session_id IS NOT NULL",
            name="ck_conversations_has_owner",
        ),
        CheckConstraint(
            "status IN ('active', 'archived', 'closed')",
            name="ck_conversations_status",
        ),
        CheckConstraint(
            "(status = 'closed' AND closed_at IS NOT NULL) OR "
            "(status <> 'closed' AND closed_at IS NULL)",
            name="ck_conversations_closed_at_consistency",
        ),
        Index("ix_conversations_user_id", "user_id"),
        Index("ix_conversations_visitor_session_id", "visitor_session_id"),
        Index("ix_conversations_last_message_at", "last_message_at"),
    )

    user: Mapped["UserAccount | None"] = relationship(
        "UserAccount",
        foreign_keys=[user_id],
    )
    visitor_session: Mapped["VisitorSession | None"] = relationship(
        "VisitorSession",
        foreign_keys=[visitor_session_id],
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        order_by="Message.sequence_no",
    )


# Import mapped classes so SQLAlchemy can resolve string-based relationships.
from app.models.accounts import UserAccount  # noqa: E402,F401
from app.models.visitor_sessions import VisitorSession  # noqa: E402,F401
from app.models.messages import Message  # noqa: E402,F401
