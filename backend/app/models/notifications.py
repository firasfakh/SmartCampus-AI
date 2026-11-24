"""SQLAlchemy model for in-app notifications."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class Notification(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "notifications"

    recipient_user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", name="fk_notifications_recipient", ondelete="RESTRICT"),
        nullable=False,
    )
    notification_type: Mapped[str] = mapped_column(String(60), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Optional reference to the related dossier, document, appointment, etc.
    entity_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_notifications_recipient_created", "recipient_user_id", "created_at"),
        Index("ix_notifications_recipient_unread", "recipient_user_id", "read_at"),
    )

    recipient: Mapped["UserAccount"] = relationship(
        "UserAccount",
        foreign_keys=[recipient_user_id],
    )


from app.models.accounts import UserAccount  # noqa: E402,F401
