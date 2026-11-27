"""
SmartCampus AI — Configuration des tests (SA-22).

Deux familles de tests :
- tests unitaires / de routes : aucun PostgreSQL nécessaire ;
- tests d'intégration (tests/test_integration_api.py) : utilisent une base
  PostgreSQL DÉDIÉE aux tests, jamais la base de développement.

Base de test : même hôte / port / utilisateur que le .env, mais la base
`smartcampus_test` (modifiable avec TEST_POSTGRES_DB). À créer une seule fois :
    docker exec -it smartcampus-postgres createdb -U smartcampus smartcampus_test
Si elle est absente, les tests d'intégration sont ignorés (skipped) avec un message.
"""

import os

# ⚠️ Doit être exécuté AVANT tout import de l'application : les variables
# d'environnement sont prioritaires sur le fichier .env.
os.environ["POSTGRES_DB"] = os.environ.get("TEST_POSTGRES_DB", "smartcampus_test")
os.environ["TESTING"] = "true"
os.environ["ENVIRONMENT"] = "test"

from pathlib import Path  # noqa: E402
from unittest.mock import AsyncMock, patch  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session", autouse=True)
def mock_db_health():
    """Le démarrage de l'API ne dépend pas de PostgreSQL pendant les tests."""
    with patch("app.main.check_database_connection", new_callable=AsyncMock) as m1, \
         patch("app.database.connection.check_database_connection", new_callable=AsyncMock) as m2:
        m1.return_value = False
        m2.return_value = False
        yield


@pytest.fixture(scope="session")
def client(mock_db_health):
    """Client HTTP de test FastAPI."""
    with TestClient(app) as test_client:
        yield test_client


# ---------------------------------------------------------------- intégration


@pytest.fixture(scope="session")
def database():
    """Base de test migrée (alembic upgrade head) et catalogue de démo chargé."""
    from alembic import command
    from alembic.config import Config
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import Session

    from app.core.config import settings

    assert settings.POSTGRES_DB != "smartcampus_db", "Les tests ne doivent jamais viser la base de dev."
    engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # base absente ou PostgreSQL arrêté
        engine.dispose()
        pytest.skip(
            f"PostgreSQL de test indisponible ({settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/"
            f"{settings.POSTGRES_DB}) : {type(exc).__name__}. Créez la base smartcampus_test."
        )

    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(cfg, "head")

    from scripts.seed_demo import DATA_FILE, upsert_institutions, upsert_programs
    import json

    with Session(engine) as db, db.begin():
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        upsert_programs(db, data, upsert_institutions(db, data))
    yield engine
    engine.dispose()


@pytest.fixture
def db(database):
    """Vider les comptes, sessions et conversations avant chaque test (le catalogue reste)."""
    from sqlalchemy import text

    with database.begin() as conn:
        conn.execute(text(
            "TRUNCATE messages, conversations, visitor_sessions, responsible_assignments, "
            "candidate_profiles, user_accounts RESTART IDENTITY CASCADE"
        ))
    return database
