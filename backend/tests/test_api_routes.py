"""
SmartCampus AI — Tests des routes API.

Vérification de la disponibilité des routes API v1.
"""

import pytest


class TestAuthRoutes:
    """Tests des routes d'authentification."""

    def test_register_route_exists(self, client):
        """POST /api/v1/auth/register doit être accessible."""
        response = client.post("/api/v1/auth/register")
        assert response.status_code != 404

    def test_login_route_exists(self, client):
        """POST /api/v1/auth/login doit être accessible."""
        response = client.post("/api/v1/auth/login")
        assert response.status_code != 404


class TestProtectedRoutes:
    """Tests des routes protégées avec authentification."""

    def test_auth_me_requires_auth(self, client):
        """GET /api/v1/auth/me doit requérir une authentification."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_auth_me_with_token(self, client, auth_headers):
        """GET /api/v1/auth/me doit fonctionner avec un token valide."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200

    def test_candidates_list_requires_responsable(self, client, auth_headers):
        """GET /api/v1/candidates/ doit requérir le rôle responsable."""
        response = client.get("/api/v1/candidates/", headers=auth_headers)
        assert response.status_code == 403

    def test_candidates_list_with_responsable(self, client, responsable_headers):
        """GET /api/v1/candidates/ doit fonctionner pour un responsable."""
        response = client.get("/api/v1/candidates/", headers=responsable_headers)
        assert response.status_code == 200


class TestConversationRoutes:
    """Tests des routes de conversations."""

    def test_conversations_require_auth(self, client):
        """Les routes de conversations doivent requérir une authentification."""
        response = client.get("/api/v1/conversations/")
        assert response.status_code == 401

    def test_create_conversation_with_auth(self, client, auth_headers):
        """POST /api/v1/conversations/ doit fonctionner avec authentification."""
        response = client.post("/api/v1/conversations/", headers=auth_headers)
        assert response.status_code == 201


class TestDocumentRoutes:
    """Tests des routes de documents."""

    def test_documents_require_auth(self, client):
        """Les routes de documents doivent requérir une authentification."""
        response = client.post("/api/v1/documents/")
        assert response.status_code == 401


class TestEquivalenceRoutes:
    """Tests des routes de demandes d'équivalence."""

    def test_equivalences_require_auth(self, client):
        """Les routes d'équivalences doivent requérir une authentification."""
        response = client.get("/api/v1/equivalences/")
        assert response.status_code == 401

    def test_equivalence_decision_requires_responsable(self, client, auth_headers):
        """La décision sur une équivalence doit requérir le rôle responsable."""
        response = client.post(
            "/api/v1/equivalences/test-id/decision", headers=auth_headers
        )
        assert response.status_code == 403


class TestPreRegistrationRoutes:
    """Tests des routes de préinscriptions."""

    def test_pre_registrations_require_auth(self, client):
        """Les routes de préinscriptions doivent requérir une authentification."""
        response = client.post("/api/v1/pre-registrations/")
        assert response.status_code == 401


class TestAppointmentRoutes:
    """Tests des routes de rendez-vous."""

    def test_appointments_require_auth(self, client):
        """Les routes de rendez-vous doivent requérir une authentification."""
        response = client.get("/api/v1/appointments/")
        assert response.status_code == 401


class TestInterviewRoutes:
    """Tests des routes d'entretiens."""

    def test_interviews_require_auth(self, client):
        """Les routes d'entretiens doivent requérir une authentification."""
        response = client.get("/api/v1/interviews/")
        assert response.status_code == 401

    def test_create_interview_requires_responsable(self, client, auth_headers):
        """La création d'entretien doit requérir le rôle responsable."""
        response = client.post("/api/v1/interviews/", headers=auth_headers)
        assert response.status_code == 403
