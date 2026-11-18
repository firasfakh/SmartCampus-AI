"""
SmartCampus AI — Configuration des tests.

Fixtures Pytest partagées pour les tests du backend.
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session", autouse=True)
def mock_db():
    """Mock de la connexion base de données pour les tests unitaires sans PostgreSQL."""
    with patch("app.main.check_database_connection", new_callable=AsyncMock) as m1, \
         patch("app.database.connection.check_database_connection", new_callable=AsyncMock) as m2:
        m1.return_value = False
        m2.return_value = False
        yield


@pytest.fixture(scope="session")
def client(mock_db):
    """Client de test FastAPI pour les tests d'intégration."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers():
    """
    Headers d'authentification pour les tests.

    TODO: Générer un vrai token JWT de test une fois
    l'authentification complètement implémentée.
    """
    from app.core.security import create_access_token

    token = create_access_token(
        data={"sub": "test-user-id", "role": "candidate"}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def responsable_headers():
    """Headers d'authentification pour un responsable de test."""
    from app.core.security import create_access_token

    token = create_access_token(
        data={"sub": "test-responsable-id", "role": "responsable"}
    )
    return {"Authorization": f"Bearer {token}"}
