"""
SmartCampus AI — Tests de l'application principale.

Tests de démarrage, endpoints racine, santé et documentation.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


class TestAppStartup:
    """Tests de démarrage de l'application."""

    def test_app_creation(self):
        """L'application FastAPI doit être créée correctement."""
        assert app is not None
        assert app.title == "SmartCampus AI API"

    def test_app_version(self):
        """L'application doit avoir une version définie."""
        assert app.version == "0.1.0"


class TestRootEndpoint:
    """Tests de l'endpoint racine."""

    def test_root_returns_200(self, client):
        """GET / doit retourner un code 200."""
        response = client.get("/")
        assert response.status_code == 200

    def test_root_returns_service_info(self, client):
        """GET / doit retourner les informations du service."""
        response = client.get("/")
        data = response.json()
        assert data["service"] == "SmartCampus AI API"
        assert "version" in data
        assert data["status"] == "running"
        assert data["documentation"] == "/docs"


class TestHealthEndpoint:
    """Tests de l'endpoint de santé."""

    def test_health_returns_200(self, client):
        """GET /health doit retourner un code 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_status(self, client):
        """GET /health doit retourner un statut de santé."""
        response = client.get("/health")
        data = response.json()
        assert "status" in data
        assert data["status"] in ("healthy", "degraded")
        assert "database" in data
        assert data["service"] == "SmartCampus AI API"


class TestDocumentation:
    """Tests de la documentation API."""

    def test_swagger_docs_available(self, client):
        """La documentation Swagger doit être accessible sur /docs."""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_redoc_available(self, client):
        """La documentation ReDoc doit être accessible sur /redoc."""
        response = client.get("/redoc")
        assert response.status_code == 200

    def test_openapi_schema_available(self, client):
        """Le schéma OpenAPI doit être accessible."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert schema["info"]["title"] == "SmartCampus AI API"
