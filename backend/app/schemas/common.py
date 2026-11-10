"""
SmartCampus AI — Schémas communs.

Schémas Pydantic réutilisables dans l'ensemble de l'application.
"""

from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class MessageResponse(BaseModel):
    """Réponse simple avec un message."""

    message: str


class ErrorDetail(BaseModel):
    """Détail d'une erreur."""

    code: str
    message: str
    details: Optional[List[Any]] = None


class ErrorResponse(BaseModel):
    """Réponse d'erreur standardisée."""

    success: bool = False
    error: ErrorDetail


class PaginatedResponse(BaseModel, Generic[T]):
    """Réponse paginée générique."""

    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int
