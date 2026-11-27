"""Tests de routes sans base de données (contrat SA-5, sécurité de base)."""


def test_auth_routes_validate_payload(client):
    assert client.post("/api/v1/auth/register", json={}).status_code == 422
    assert client.post("/api/v1/auth/login", json={}).status_code == 422


def test_protected_read_routes_require_auth(client):
    paths = [
        "/api/v1/auth/me",
        "/api/v1/auth/users",
        "/api/v1/candidates/",
        "/api/v1/conversations/",
        "/api/v1/appointments/",
        "/api/v1/interviews/",
        "/api/v1/equivalences/",
    ]
    for path in paths:
        response = client.get(path)
        assert response.status_code == 401, (path, response.status_code)


def test_errors_use_the_uniform_format(client):
    body = client.get("/api/v1/auth/me").json()
    assert body["success"] is False
    assert body["error"]["code"] == "UNAUTHORIZED"
    assert body["detail"] == body["error"]["message"]


def test_invalid_jwt_is_rejected(client):
    r = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer pas-un-jwt"})
    assert r.status_code == 401


def test_contract_routes_are_registered(client):
    paths = client.get("/openapi.json").json()["paths"]
    for path in (
        "/api/v1/sessions/visitor",
        "/api/v1/sessions/visitor/me",
        "/api/v1/sessions/visitor/claim",
        "/api/v1/catalog/institutions",
        "/api/v1/catalog/programs",
        "/api/v1/catalog/programs/{program_id}",
        "/api/v1/catalog/fees",
        "/api/v1/conversations/",
        "/api/v1/conversations/{conversation_id}",
        "/api/v1/conversations/{conversation_id}/messages",
        "/api/v1/conversations/{conversation_id}/memory",
        "/api/v1/auth/users",
        "/api/v1/auth/users/{user_id}/role",
        "/api/v1/auth/users/{user_id}/status",
    ):
        assert path in paths, path
