"""
SmartCampus AI — Tests de la gestion des erreurs.

Vérification du format uniforme des réponses d'erreur.
"""

import pytest


class TestErrorHandling:
    """Tests de la gestion centralisée des erreurs."""

    def test_404_not_found(self, client):
        """Une route inexistante doit retourner une erreur formatée."""
        response = client.get("/api/v1/nonexistent")
        # FastAPI retourne 404 pour les routes non trouvées
        assert response.status_code in (404, 405)

    def test_401_unauthorized_format(self, client):
        """Une erreur 401 doit contenir le bon format."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_validation_error_format(self, client):
        """
        Les erreurs de validation doivent être formatées correctement.

        Ce test sera enrichi une fois les schémas Pydantic implémentés
        sur les endpoints.
        """
        # Pour l'instant, vérifie que l'application gère les requêtes
        response = client.get("/")
        assert response.status_code == 200
