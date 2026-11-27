"""
SA-22 — Tests d'intégration sur une vraie base PostgreSQL (smartcampus_test).

Couvre SA-20/21 (catalogue, tarifs), SA-25 (sessions visiteurs), SA-26 (mémoire
et limites), SA-28 (inscription, connexion, rôles) et SA-29 (rattachement).
"""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import text

from app.core.security import hash_password

API = "/api/v1"
PASSWORD = "Secret12345!"


# ---------------------------------------------------------------- helpers

def register(client, email="candidat@test.example", password=PASSWORD):
    r = client.post(f"{API}/auth/register", json={
        "first_name": "Sara", "last_name": "Ben Ali", "email": email, "password": password,
    })
    assert r.status_code == 201, r.text
    return r.json()


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def visitor(client):
    r = client.post(f"{API}/sessions/visitor")
    assert r.status_code == 201, r.text
    return {"X-Visitor-Token": r.json()["session_token"]}


def create_admin(engine, email="admin@test.example"):
    with engine.begin() as conn:
        conn.execute(
            text("INSERT INTO user_accounts (id, email, password_hash, role) "
                 "VALUES (gen_random_uuid(), :e, :h, 'admin')"),
            {"e": email, "h": hash_password(PASSWORD)},
        )


def login(client, email, password=PASSWORD):
    r = client.post(f"{API}/auth/login", json={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def new_conversation(client, headers):
    r = client.post(f"{API}/conversations/", json={}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def say(client, cid, content, headers):
    return client.post(f"{API}/conversations/{cid}/messages", json={"content": content}, headers=headers)


# ---------------------------------------------------------------- SA-20 / SA-21 catalogue


def test_catalog_lists_seeded_programs_and_published_fees(client, db):
    programs = client.get(f"{API}/catalog/programs").json()
    assert len(programs) == 9
    assert {p["institution_code"] for p in programs} == {"IIT", "ISB"}
    assert all(p["tuition"] and p["tuition"]["currency"] == "TND" for p in programs)

    isb = client.get(f"{API}/catalog/programs", params={"institution": "isb"}).json()
    assert len(isb) == 4 and all(p["institution_code"] == "ISB" for p in isb)

    found = client.get(f"{API}/catalog/programs", params={"search": "civil"}).json()
    assert [p["program_code"] for p in found] == ["IIT-ING-CIVIL"]

    detail = client.get(f"{API}/catalog/programs/{found[0]['id']}").json()
    assert detail["admission_requirements"] and detail["fees"] and detail["careers"]

    fees = client.get(f"{API}/catalog/fees").json()
    assert len(fees) == 9 and all(f["status"] == "published" for f in fees)
    assert client.get(f"{API}/catalog/programs/999999").status_code == 404


def test_catalog_write_requires_role_and_institution_scope(client, db):
    candidate = register(client)
    program = client.get(f"{API}/catalog/programs", params={"search": "civil"}).json()[0]
    patch_url = f"{API}/catalog/programs/{program['id']}"

    assert client.patch(patch_url, json={"program_duration": "3 ans"}).status_code == 401
    assert client.patch(patch_url, json={"program_duration": "3 ans"},
                        headers=bearer(candidate["access_token"])).status_code == 403

    create_admin(db)
    admin = login(client, "admin@test.example")
    for email, inst in (("resp.iit@test.example", "IIT"), ("resp.isb@test.example", "ISB")):
        r = client.post(f"{API}/auth/users", headers=bearer(admin["access_token"]), json={
            "email": email, "password": PASSWORD, "role": "responsable_academique", "institution_code": inst,
        })
        assert r.status_code == 201, r.text
        assert r.json()["institution_code"] == inst

    resp_isb = login(client, "resp.isb@test.example")
    assert client.patch(patch_url, json={"program_duration": "3 ans"},
                        headers=bearer(resp_isb["access_token"])).status_code == 403
    resp_iit = login(client, "resp.iit@test.example")
    r = client.patch(patch_url, json={"program_duration": "3 ans"}, headers=bearer(resp_iit["access_token"]))
    assert r.status_code == 200 and r.json()["institution_code"] == "IIT"


# ---------------------------------------------------------------- SA-28 authentification


def test_register_login_me_and_role_is_server_side(client, db):
    data = register(client, email="Sara@Test.Example")
    assert data["user"]["role"] == "candidate"
    assert data["user"]["email"] == "sara@test.example"  # normalisé

    # Tentative d'élévation : le champ `role` est ignoré à l'inscription.
    r = client.post(f"{API}/auth/register", json={
        "first_name": "X", "last_name": "Y", "email": "hacker@test.example",
        "password": PASSWORD, "role": "admin",
    })
    assert r.status_code == 201 and r.json()["user"]["role"] == "candidate"

    assert client.post(f"{API}/auth/register", json={
        "first_name": "S", "last_name": "B", "email": "sara@test.example", "password": PASSWORD,
    }).status_code == 409

    me = client.get(f"{API}/auth/me", headers=bearer(login(client, "SARA@test.example")["access_token"]))
    assert me.status_code == 200 and me.json()["first_name"] == "Sara"

    bad = client.post(f"{API}/auth/login", json={"username": "sara@test.example", "password": "wrong-pass1"})
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.parametrize("password", ["court1", "sanschiffre", "12345678"])
def test_weak_passwords_are_rejected(client, db, password):
    r = client.post(f"{API}/auth/register", json={
        "first_name": "A", "last_name": "B", "email": "weak@test.example", "password": password,
    })
    assert r.status_code == 422


def test_admin_manages_roles_and_deactivation(client, db):
    create_admin(db)
    admin = login(client, "admin@test.example")
    headers = bearer(admin["access_token"])

    # Un responsable sans établissement est refusé.
    assert client.post(f"{API}/auth/users", headers=headers, json={
        "email": "r@test.example", "password": PASSWORD, "role": "responsable_entretien",
    }).status_code == 422
    # L'inscription publique ne peut pas créer de rôle interne et un candidat n'accède pas à /auth/users.
    candidate = register(client)
    assert client.get(f"{API}/auth/users", headers=bearer(candidate["access_token"])).status_code == 403

    created = client.post(f"{API}/auth/users", headers=headers, json={
        "email": "dir@test.example", "password": PASSWORD, "role": "direction",
    }).json()
    moved = client.patch(f"{API}/auth/users/{created['id']}/role", headers=headers, json={
        "role": "responsable_academique", "institution_code": "ISB",
    })
    assert moved.status_code == 200 and moved.json()["institution_code"] == "ISB"

    # Candidat -> interne interdit.
    assert client.patch(f"{API}/auth/users/{candidate['user']['id']}/role", headers=headers,
                        json={"role": "direction"}).status_code == 409

    # Désactivation : l'ancien JWT du compte devient inutilisable.
    dir_token = login(client, "dir@test.example")["access_token"]
    assert client.patch(f"{API}/auth/users/{created['id']}/status", headers=headers,
                        json={"is_active": False}).status_code == 200
    assert client.get(f"{API}/auth/me", headers=bearer(dir_token)).status_code == 401
    assert client.post(f"{API}/auth/login", json={"username": "dir@test.example",
                                                  "password": PASSWORD}).status_code == 401


# ---------------------------------------------------------------- SA-25 / SA-26 visiteurs et mémoire


def test_visitor_session_token_is_hashed_and_isolated(client, db):
    v1, v2 = visitor(client), visitor(client)
    raw = v1["X-Visitor-Token"]
    with db.connect() as conn:
        hashes = conn.execute(text("SELECT token_hash FROM visitor_sessions")).scalars().all()
    assert raw not in hashes and len(hashes) == 2

    cid = new_conversation(client, v1)
    assert say(client, cid, "Bonjour", v1).status_code == 201
    # Un autre visiteur ne voit pas la conversation (404, pas 403 : on ne révèle rien).
    assert client.get(f"{API}/conversations/{cid}/messages", headers=v2).status_code == 404
    assert client.get(f"{API}/conversations/", headers=v2).json() == []
    assert client.get(f"{API}/conversations/").status_code == 401
    assert client.get(f"{API}/sessions/visitor/me", headers={"X-Visitor-Token": "faux"}).status_code == 401


def test_assistant_replies_from_catalog_and_uses_memory(client, db):
    v = visitor(client)
    cid = new_conversation(client, v)

    first = say(client, cid, "J'ai un bac math et je suis passionné d'informatique", v).json()
    assert first["user_message"]["sequence_no"] == 1
    assert first["assistant_message"]["sequence_no"] == 2
    assert "IIT-ING-INFO" in first["assistant"]["program_codes"]
    assert first["conversation"]["title"].startswith("J'ai un bac math")

    # « combien ? » sans citer la formation : la mémoire désigne l'informatique.
    fees = say(client, cid, "Et ça coûte combien ?", v).json()
    assert fees["assistant"]["intent"] == "fees"
    assert "7 200 TND" in fees["assistant_message"]["content"].replace("\u00a0", " ")

    arabizi = say(client, cid, "chnowa les conditions d'admission en genie civil", v).json()
    assert arabizi["assistant"]["language_detected"] == "arabizi"
    assert arabizi["assistant"]["program_codes"] == ["IIT-ING-CIVIL"]

    memory = client.get(f"{API}/conversations/{cid}/memory", headers=v).json()
    assert memory["profile_hints"]["section"] == "Mathématiques"
    assert "Informatique & IA" in memory["profile_hints"]["interests"]
    assert len(memory["messages"]) == 6

    history = client.get(f"{API}/conversations/{cid}/messages", headers=v).json()
    assert [m["sequence_no"] for m in history] == [1, 2, 3, 4, 5, 6]
    assert [m["role"] for m in history[:2]] == ["user", "assistant"]


def test_visitor_limits(client, db, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "VISITOR_MAX_MESSAGES", 2)
    monkeypatch.setattr(settings, "VISITOR_MAX_CONVERSATIONS", 2)
    v = visitor(client)
    cid = new_conversation(client, v)
    new_conversation(client, v)
    assert client.post(f"{API}/conversations/", json={}, headers=v).status_code == 429
    assert say(client, cid, "un", v).status_code == 201
    assert say(client, cid, "deux", v).status_code == 201
    blocked = say(client, cid, "trois", v)
    assert blocked.status_code == 429 and blocked.json()["error"]["code"] == "TOO_MANY_REQUESTS"


def test_archived_conversation_rejects_messages(client, db):
    v = visitor(client)
    cid = new_conversation(client, v)
    assert client.patch(f"{API}/conversations/{cid}", json={"status": "archived"}, headers=v).status_code == 200
    assert say(client, cid, "Bonjour", v).status_code == 409


def test_expired_visitor_memory_is_purged(client, db):
    import asyncio

    from app.main import purge_expired_visitor_sessions

    v = visitor(client)
    cid = new_conversation(client, v)
    say(client, cid, "Bonjour", v)
    with db.begin() as conn:
        conn.execute(text("UPDATE visitor_sessions SET expires_at = :t"),
                     {"t": datetime.now(timezone.utc) - timedelta(minutes=1)})
    assert client.get(f"{API}/conversations/", headers=v).status_code == 401  # session expirée

    assert asyncio.run(purge_expired_visitor_sessions()) == 1
    with db.connect() as conn:
        counts = conn.execute(text(
            "SELECT (SELECT count(*) FROM visitor_sessions), (SELECT count(*) FROM conversations), "
            "(SELECT count(*) FROM messages)"
        )).one()
    assert tuple(counts) == (0, 0, 0)


# ---------------------------------------------------------------- SA-29 rattachement


def test_claim_transfers_history_and_revokes_visitor_token(client, db):
    v = visitor(client)
    cid = new_conversation(client, v)
    say(client, cid, "Bonjour, je veux faire de l'informatique", v)
    token = register(client)["access_token"]
    both = {**v, **bearer(token)}

    assert client.post(f"{API}/sessions/visitor/claim", json={"consent": False}, headers=both).status_code == 400
    assert client.post(f"{API}/sessions/visitor/claim", json={"consent": True}, headers=bearer(token)).status_code == 401

    r = client.post(f"{API}/sessions/visitor/claim", json={"consent": True}, headers=both)
    assert r.status_code == 200, r.text
    assert r.json()["conversation_ids"] == [cid]

    mine = client.get(f"{API}/conversations/", headers=bearer(token)).json()
    assert [c["id"] for c in mine] == [cid] and mine[0]["owner_type"] == "candidate"
    assert mine[0]["message_count"] == 2

    # L'ancien jeton visiteur est révoqué : plus d'accès, plus de second rattachement.
    assert client.get(f"{API}/conversations/{cid}/messages", headers=v).status_code == 401
    assert client.post(f"{API}/sessions/visitor/claim", json={"consent": True}, headers=both).status_code == 401

    # Le candidat continue la conversation avec la mémoire conservée.
    follow = say(client, cid, "combien ça coûte ?", bearer(token)).json()
    assert "IIT-ING-INFO" in follow["assistant"]["program_codes"]


def test_claim_is_reserved_to_candidates(client, db):
    create_admin(db)
    admin_token = login(client, "admin@test.example")["access_token"]
    v = visitor(client)
    r = client.post(f"{API}/sessions/visitor/claim", json={"consent": True},
                    headers={**v, **bearer(admin_token)})
    assert r.status_code == 403
    # Les comptes internes n'utilisent pas l'assistant candidat.
    assert client.get(f"{API}/conversations/", headers=bearer(admin_token)).status_code == 403
