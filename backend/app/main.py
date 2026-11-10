"""
SmartCampus AI — Application principale FastAPI.

Point d'entrée du backend SmartCampus AI développé par l'équipe FYKEK — Groupe 3.
Plateforme intelligente de gestion des candidats, des demandes administratives
et des conversations avec un assistant IA.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import SmartCampusException, setup_exception_handlers
from app.database.connection import engine, check_database_connection

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application."""
    logger.info("Démarrage de SmartCampus AI API...")
    # Vérification de la connexion à la base de données
    db_ok = await check_database_connection()
    if db_ok:
        logger.info("Connexion à la base de données établie.")
    else:
        logger.warning(
            "Impossible de se connecter à la base de données. "
            "L'application démarre sans connexion active."
        )
    yield
    logger.info("Arrêt de SmartCampus AI API...")
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
