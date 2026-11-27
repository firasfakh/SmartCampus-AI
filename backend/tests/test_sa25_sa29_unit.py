"""Tests unitaires (sans base) : sécurité, mémoire et assistant."""

from app.core.security import (
    UserRole,
    create_access_token,
    decode_access_token,
    password_policy_error,
)
from app.services.assistant import detect_intents, detect_language
from app.services.memory import extract_profile_hints
from app.services.visitor_sessions import _hash_token


def test_visitor_token_is_hashed_before_persistence():
    raw = "a-long-random-visitor-token"
    digest = _hash_token(raw)
    assert digest != raw and len(digest) == 64 and digest == _hash_token(raw)


def test_jwt_contains_subject_role_and_expiry():
    payload = decode_access_token(create_access_token({"sub": "candidate-id", "role": "candidate"}))
    assert payload["sub"] == "candidate-id" and payload["role"] == "candidate"
    assert "exp" in payload and "iat" in payload


def test_database_roles_match_sa13_constraints():
    assert {r.value for r in UserRole} - {"visitor"} == {
        "candidate", "responsable_academique", "responsable_entretien", "direction", "admin",
    }


def test_password_policy():
    assert password_policy_error("Secret123") is None
    assert password_policy_error("court1")
    assert password_policy_error("sanschiffre")
    assert password_policy_error("a1" * 40)  # > 72 octets


def test_profile_hints_use_whole_words():
    hints = extract_profile_hints(["J'ai un bac math et j'aime l'informatique"])
    assert hints["interests"] == ["Informatique & IA"]  # « j'ai » ne déclenche pas « ai »
    assert hints["level"] == "Baccalauréat" and hints["section"] == "Mathématiques"


def test_intent_and_language_detection():
    assert "fees" in detect_intents("Quels sont les frais ?")
    assert "admission" in detect_intents("conditions d'admission")
    assert detect_language("nheb na9ra informatique") == "arabizi"
    assert detect_language("أريد التسجيل") == "ar_tn"
    assert detect_language("Bonjour") == "fr"
