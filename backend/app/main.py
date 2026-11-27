"""
SmartCampus AI — Application principale FastAPI.

Point d'entrée du backend SmartCampus AI développé par l'équipe FYKEK — Groupe 3.
Plateforme intelligente de gestion des candidats, des demandes administratives
et des conversations avec un assistant IA.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import SmartCampusException, setup_exception_handlers
from app.database.connection import engine, check_database_connection, async_session_factory
from app.services.visitor_sessions import cleanup_expired_visitor_memory

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def purge_expired_visitor_sessions() -> int:
    """SA-26 — Supprimer la mémoire des sessions visiteurs expirées et non rattachées."""
    async with async_session_factory() as session:
        removed = await cleanup_expired_visitor_memory(session)
        await session.commit()
    if removed:
        logger.info("Mémoire visiteur purgée : %s session(s) expirée(s).", removed)
    return removed


async def _periodic_cleanup() -> None:
    interval = max(settings.VISITOR_CLEANUP_INTERVAL_MINUTES, 1) * 60
    while True:
        await asyncio.sleep(interval)
        try:
            await purge_expired_visitor_sessions()
        except Exception:  # la purge ne doit jamais arrêter l'API
            logger.exception("La purge périodique des sessions visiteurs a échoué.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application."""
    logger.info("Démarrage de SmartCampus AI API (%s)...", settings.ENVIRONMENT)
    cleanup_task = None
    if await check_database_connection():
        logger.info("Connexion à la base de données établie.")
        try:
            await purge_expired_visitor_sessions()
        except Exception:
            logger.exception("Le nettoyage des sessions visiteurs a échoué (migrations appliquées ?).")
        cleanup_task = asyncio.create_task(_periodic_cleanup())
    else:
        logger.warning(
            "Impossible de se connecter à PostgreSQL (%s:%s). L'API démarre en mode dégradé : "
            "vérifiez que la base est lancée (docker compose up -d db) et le fichier .env.",
            settings.POSTGRES_HOST,
            settings.POSTGRES_PORT,
        )
    yield
    logger.info("Arrêt de SmartCampus AI API...")
    if cleanup_task:
        cleanup_task.cancel()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des gestionnaires d'exceptions
setup_exception_handlers(app)

# Inclusion du routeur API v1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    """
    Point d'entrée racine de l'API.

    Retourne les informations de base sur le service.
    """
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Vérification de l'état de santé de l'application.

    Vérifie la disponibilité du service et de la base de données.
    """
    db_status = await check_database_connection()
    return {
        "status": "healthy" if db_status else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected" if db_status else "disconnected",
    }
