"""
SmartCampus AI — Base déclarative SQLAlchemy.

Classe de base pour tous les modèles ORM du projet.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    Classe de base pour tous les modèles SQLAlchemy de SmartCampus AI.

    Fournit automatiquement les colonnes id, created_at et updated_at.
    """

    pass


class TimestampMixin:
    """Mixin ajoutant les colonnes de suivi temporel."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UUIDMixin:
    """Mixin ajoutant une clé primaire UUID."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
