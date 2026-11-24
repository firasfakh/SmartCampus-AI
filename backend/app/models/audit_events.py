"""SQLAlchemy model for append-only administrative audit events."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class AuditEvent(UUIDMixin, Base):
    __tablename__ = "audit_events"

    actor_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", name="fk_audit_events_actor", ondelete="RESTRICT"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    old_values: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    request_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)

    actor: Mapped["UserAccount | None"] = relationship(
        "UserAccount",
        foreign_keys=[actor_user_id],
    )

    __table_args__ = (
        Index("ix_audit_events_actor_user_id", "actor_user_id"),
        Index("ix_audit_events_entity", "entity_type", "entity_id"),
        Index("ix_audit_events_occurred_at", "occurred_at"),
        Index("ix_audit_events_action", "action"),
        Index("ix_audit_events_request_id", "request_id"),
    )


from app.models.accounts import UserAccount  # noqa: E402,F401
