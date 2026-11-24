"""SQLAlchemy model for individual messages in a conversation."""

from __future__ import annotations

from uuid import UUID as PyUUID

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class Message(UUIDMixin, TimestampMixin, Base):
    """A single ordered message belonging to a conversation."""

    __tablename__ = "messages"

    conversation_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "conversations.id",
            name="fk_messages_conversation",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    sequence_no: Mapped[int] = mapped_column(Integer, nullable=False)
    sender_type: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "conversation_id",
            "sequence_no",
            name="uq_messages_conversation_sequence",
        ),
        CheckConstraint(
            "sequence_no >= 1",
            name="ck_messages_sequence_no_positive",
        ),
        CheckConstraint(
            "sender_type IN ('user', 'assistant', 'system')",
            name="ck_messages_sender_type",
        ),
        Index("ix_messages_conversation_id", "conversation_id"),
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="messages",
    )


from app.models.conversations import Conversation  # noqa: E402,F401
