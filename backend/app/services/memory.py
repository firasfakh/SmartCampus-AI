"""
SmartCampus AI — Mémoire conversationnelle (SA-26).

Deux niveaux :
1. Mémoire persistée : tous les messages sont stockés dans `messages`
   (temporaire pour un visiteur : purgée à expiration si non rattachée).
2. Mémoire de travail : fenêtre des N derniers messages + indices de profil
   extraits des messages du candidat (centres d'intérêt, niveau, section).
   C'est ce que l'assistant — et plus tard l'agent LangGraph — reçoit en contexte.

Le format retourné par `build_memory` est volontairement simple (dict JSON) pour
pouvoir être passé tel quel à un agent LLM.
"""

import re
import unicodedata
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.messages import Message

# Mots-clés -> centre d'intérêt (texte normalisé, sans accents).
INTEREST_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Informatique & IA": (
        "informatique", "info", "logiciel", "developpement", "developpeur", "programmation",
        "code", "web", "data", "intelligence artificielle", "ia", "ai", "cyber", "reseau",
        "machine learning",
    ),
    "Génie civil & BTP": ("genie civil", "civil", "btp", "batiment", "construction", "structure"),
    "Génie industriel & logistique": ("industriel", "logistique", "supply", "production", "qualite"),
    "Mécatronique & électronique": ("mecatronique", "electronique", "robotique", "automatique", "electrique"),
    "Business & management": (
        "business", "gestion", "management", "marketing", "commerce", "finance", "comptabilite",
        "entrepreneuriat", "economie",
    ),
}

LEVEL_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Baccalauréat": ("bac", "baccalaureat", "lycee", "lyceen", "terminale"),
    "Classes préparatoires": ("prepa", "preparatoire"),
    "Licence / Bac+3": ("licence", "bac+3", "bac +3", "l3"),
    "Master / Bac+5": ("master", "bac+5", "mastere"),
}

SECTION_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Mathématiques": ("section math", "bac math", "mathematiques", "maths"),
    "Sciences expérimentales": ("sciences experimentales", "sc exp", "bac science"),
    "Sciences techniques": ("technique", "sciences techniques", "bac technique"),
    "Économie & gestion": ("eco gestion", "economie et gestion", "bac eco"),
    "Informatique (bac)": ("bac info", "section info", "sciences de l'informatique"),
}


def normalize(text: str) -> str:
    """Minuscules, sans accents, espaces simples — utilisé pour la détection de mots-clés."""
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return f" {re.sub(r'\s+', ' ', text).strip()} "


def contains_word(text: str, word: str) -> bool:
    """Recherche d'un mot ou d'une expression entière (évite que « ai » matche « j'ai »)."""
    return re.search(rf"(?<![a-z0-9]){re.escape(word.strip())}(?![a-z0-9])", text) is not None


def _match(text: str, table: dict[str, tuple[str, ...]]) -> list[str]:
    return [label for label, words in table.items() if any(contains_word(text, w) for w in words)]


def extract_profile_hints(user_texts: list[str]) -> dict:
    """Extraire des indices de profil (non validés) à partir des messages du candidat."""
    joined = normalize(" ".join(user_texts))
    interests = _match(joined, INTEREST_KEYWORDS)
    levels = _match(joined, LEVEL_KEYWORDS)
    sections = _match(joined, SECTION_KEYWORDS)
    return {
        "interests": interests,
        "level": levels[-1] if levels else None,
        "section": sections[-1] if sections else None,
    }


async def get_recent_messages(
    db: AsyncSession, conversation_id: UUID, limit: int | None = None
) -> list[Message]:
    """Les `limit` derniers messages d'une conversation, dans l'ordre chronologique."""
    limit = limit or settings.MEMORY_WINDOW_MESSAGES
    rows = (await db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.sequence_no.desc())
        .limit(limit)
    )).all()
    return list(reversed(rows))


async def build_memory(db: AsyncSession, conversation_id: UUID) -> dict:
    """Mémoire de travail d'une conversation : fenêtre de messages + indices de profil."""
    recent = await get_recent_messages(db, conversation_id)
    user_texts = [m.content for m in recent if m.sender_type == "user"]
    return {
        "window_size": settings.MEMORY_WINDOW_MESSAGES,
        "messages": [
            {"role": m.sender_type, "content": m.content, "sequence_no": m.sequence_no}
            for m in recent
        ],
        "profile_hints": extract_profile_hints(user_texts),
    }
