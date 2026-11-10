"""
SmartCampus AI — Gestion centralisée des exceptions.

Définition des exceptions métier et des gestionnaires d'erreurs
pour uniformiser les réponses d'erreur de l'API.
"""

import logging
from typing import Any, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


# --- Exceptions personnalisées ---


class SmartCampusException(Exception):
    """Exception de base pour SmartCampus AI."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
    ):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code or f"ERR_{status_code}"
        super().__init__(self.detail)


class BadRequestException(SmartCampusException):
    """Requête invalide (400)."""

    def __init__(self, detail: str = "Requête invalide."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BAD_REQUEST",
        )


class UnauthorizedException(SmartCampusException):
    """Non authentifié (401)."""

    def __init__(self, detail: str = "Authentification requise."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(SmartCampusException):
    """Accès interdit (403)."""

    def __init__(self, detail: str = "Accès refusé."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN",
        )


class NotFoundException(SmartCampusException):
    """Ressource non trouvée (404)."""

    def __init__(self, detail: str = "Ressource non trouvée."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="NOT_FOUND",
        )


class ConflictException(SmartCampusException):
    """Conflit de données (409)."""

    def __init__(self, detail: str = "Conflit avec l'état actuel de la ressource."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="CONFLICT",
        )


class UnprocessableEntityException(SmartCampusException):
    """Entité non traitable (422)."""

    def __init__(self, detail: str = "Données non traitables."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="UNPROCESSABLE_ENTITY",
        )


class InternalServerException(SmartCampusException):
    """Erreur serveur interne (500)."""

    def __init__(self, detail: str = "Erreur interne du serveur."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="INTERNAL_SERVER_ERROR",
        )


# --- Gestionnaires d'exceptions ---


def _error_response(
    status_code: int,
    detail: str,
    error_code: str,
) -> JSONResponse:
    """Construire une réponse d'erreur standardisée."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": detail,
            },
        },
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Enregistrer les gestionnaires d'exceptions sur l'application FastAPI."""

    @app.exception_handler(SmartCampusException)
    async def smartcampus_exception_handler(
        request: Request, exc: SmartCampusException
    ) -> JSONResponse:
        logger.warning(
            "SmartCampusException: %s %s — %s (code=%s)",
            request.method,
            request.url.path,
            exc.detail,
            exc.error_code,
        )
        return _error_response(exc.status_code, exc.detail, exc.error_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning(
            "Erreur de validation: %s %s — %s",
            request.method,
            request.url.path,
            str(exc.errors()),
        )
        # Formater les erreurs de validation sans exposer de données sensibles
        errors = []
        for error in exc.errors():
            errors.append(
                {
                    "field": " -> ".join(str(loc) for loc in error.get("loc", [])),
                    "message": error.get("msg", "Erreur de validation"),
                    "type": error.get("type", "unknown"),
                }
            )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Erreur de validation des données.",
                    "details": errors,
                },
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        # Journaliser l'erreur complète côté serveur
        logger.error(
            "Erreur non gérée: %s %s — %s: %s",
            request.method,
            request.url.path,
            type(exc).__name__,
            str(exc),
            exc_info=True,
        )
        # Ne jamais exposer les détails internes au client
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Erreur interne du serveur.",
            "INTERNAL_SERVER_ERROR",
        )
