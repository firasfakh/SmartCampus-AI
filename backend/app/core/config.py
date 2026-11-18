"""
SmartCampus AI — Configuration de l'application.

Gestion centralisée des paramètres via variables d'environnement.
Utilise pydantic-settings pour la validation et le chargement automatique
depuis le fichier .env.
"""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


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
        "Plateforme intelligente de gestion des candidats, "
        "des demandes administratives et des conversations avec un assistant IA. "
        "Développée par l'équipe FYKEK — Groupe 3."
    )
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    # --- Base de données PostgreSQL ---
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "smartcampus"
    POSTGRES_PASSWORD: str = "smartcampus"
    POSTGRES_DB: str = "smartcampus_db"

    @property
    def DATABASE_URL(self) -> str:
        """URL de connexion PostgreSQL pour SQLAlchemy (driver asyncpg)."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """URL de connexion PostgreSQL synchrone (pour Alembic)."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # --- Sécurité et JWT ---
    SECRET_KEY: str = "change-me-in-production-use-a-strong-random-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- CORS ---
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]

    # --- Stockage des documents ---
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10


settings = Settings()
