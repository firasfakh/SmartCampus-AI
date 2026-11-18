"""
SmartCampus AI — Connexion à la base de données PostgreSQL.

Configuration de SQLAlchemy avec le driver asynchrone asyncpg.
Gestion du cycle de vie des sessions et des connexions.
"""

import asyncio
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text

from app.core.config import settings

logger = logging.getLogger(__name__)

# Moteur de base de données asynchrone
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"timeout": 2.0},
)

# Fabrique de sessions asynchrones
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dépendance FastAPI fournissant une session de base de données.

    Gère automatiquement le commit en cas de succès et le rollback en cas d'erreur.

    Yields:
        AsyncSession: Session de base de données active.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_connection() -> bool:
    """
    Vérifier la connexion à la base de données.

    Effectue un test de connectivité rapide avant d'interroger SQLAlchemy,
    évitant tout blocage prolongé si la base n'est pas démarrée.

    Returns:
        True si la connexion est établie, False sinon.
    """
    import socket

    def _is_db_reachable(host: str, port: int) -> bool:
        try:
            with socket.create_connection((host, port), timeout=0.5):
                return True
        except Exception:
            return False

    # Test rapide de connectivité réseau/socket
    loop = asyncio.get_running_loop()
    reachable = await loop.run_in_executor(
        None, _is_db_reachable, settings.POSTGRES_HOST, settings.POSTGRES_PORT
    )
    if not reachable:
        logger.warning(
            "Base de données non joignable sur %s:%s",
            settings.POSTGRES_HOST,
            settings.POSTGRES_PORT,
        )
        return False

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning("Échec de connexion à la base de données: %s", str(e))
        return False
