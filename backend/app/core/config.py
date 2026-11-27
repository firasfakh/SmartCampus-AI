"""
SmartCampus AI — Configuration de l'application.

Gestion centralisée des paramètres via variables d'environnement.
Utilise pydantic-settings pour la validation et le chargement automatique
depuis le fichier .env (les variables d'environnement du shell sont prioritaires).
"""

import logging
from typing import Annotated, List, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy.engine import URL

logger = logging.getLogger(__name__)

DEFAULT_SECRET_KEY = "change-me-in-production-use-a-strong-random-key"


class Settings(BaseSettings):
    """Configuration principale de l'application SmartCampus AI."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Informations du projet ---
    PROJECT_NAME: str = "SmartCampus AI API"
    PROJECT_DESCRIPTION: str = (
        "Plateforme intelligente d'orientation et d'admission IIT / ISB : "
        "catalogue académique, sessions visiteurs, conversations avec l'assistant, "
        "comptes candidats et rôles internes. Équipe FYKEK — Groupe 3."
    )
    VERSION: str = "0.2.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    # Pool de connexions désactivé (NullPool) pendant les tests d'intégration.
    TESTING: bool = False

    # --- Base de données PostgreSQL ---
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5433
    POSTGRES_USER: str = "smartcampus"
    POSTGRES_PASSWORD: str = "smartcampus_dev_only"
    POSTGRES_DB: str = "smartcampus_db"

    @property
    def DATABASE_URL(self) -> str:
        """URL de connexion PostgreSQL pour SQLAlchemy (driver asyncpg)."""
        return URL.create(
            drivername="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB,
        ).render_as_string(hide_password=False)

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """URL de connexion PostgreSQL synchrone (pour Alembic et les scripts)."""
        return URL.create(
            drivername="postgresql+psycopg2",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB,
        ).render_as_string(hide_password=False)

    # --- Sécurité et JWT (SA-28) ---
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- Sessions visiteurs et mémoire (SA-25 / SA-26) ---
    VISITOR_SESSION_TTL_HOURS: int = 24
    VISITOR_MAX_CONVERSATIONS: int = 5
    VISITOR_MAX_MESSAGES: int = 60
    # Nombre de messages récents fournis à l'assistant comme mémoire de travail.
    MEMORY_WINDOW_MESSAGES: int = 20
    # Intervalle de purge des sessions visiteurs expirées (minutes).
    VISITOR_CLEANUP_INTERVAL_MINUTES: int = 60

    # --- CORS ---
    # Dans .env : CORS_ORIGINS=http://localhost:5173,http://localhost:3000
    CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    # --- Stockage des documents ---
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    @property
    def uses_default_secret(self) -> bool:
        return self.SECRET_KEY == DEFAULT_SECRET_KEY or len(self.SECRET_KEY) < 32


settings = Settings()

if settings.uses_default_secret:
    if settings.ENVIRONMENT == "production":
        raise RuntimeError(
            "SECRET_KEY absente ou trop courte : impossible de démarrer en production."
        )
    logger.warning(
        "SECRET_KEY par défaut ou trop courte : acceptable en développement uniquement. "
        "Générez-en une avec : python -c \"import secrets; print(secrets.token_urlsafe(64))\""
    )
