"""
SmartCampus AI — Assistant d'orientation PROVISOIRE (règles + catalogue).

⚠️ Ce module n'est pas l'agent IA final. Il permet d'avoir un chat fonctionnel
de bout en bout (front → API → base) en attendant l'agent LangGraph + RAG :

- il détecte une intention simple (frais, admission, débouchés, liste des
  formations, salutation, conseiller humain) par mots-clés français / tunisien /
  Arabizi ;
- il répond UNIQUEMENT avec les données présentes dans le catalogue en base
  (tables academic_programs, program_fees, admission_requirements, ...) : il ne
  fabrique aucun chiffre ;
- il exploite la mémoire de travail (SA-26) : si le candidat a parlé
  d'informatique plus tôt, « combien ça coûte ? » vise les formations d'informatique.

Pour brancher l'agent IA : remplacer `generate_reply` par un appel à l'agent en
lui passant `memory` (fenêtre de messages + indices de profil). La signature
(`db`, `memory`, `user_text`) -> AssistantReply reste la même côté endpoint.
"""

from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import AcademicProgram
from app.services.memory import contains_word, extract_profile_hints, normalize

GENERATOR_NAME = "regles-catalogue-v1"

INTENT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "fees": (
        "frais", "tarif", "tarifs", "prix", "cout", "coute", "combien", "scolarite", "paiement",
        "payer", "9adeh", "9adech", "qadech", "flous", "soum",
    ),
    "admission": (
        "admission", "condition", "conditions", "inscription", "inscrire", "prerequis",
        "dossier", "documents", "acces", "acceder", "postuler", "candidature", "dkhoul",
        "nod5el", "nodkhel", "entrer",
    ),
    "careers": (
        "debouche", "debouches", "metier", "metiers", "emploi", "travail", "carriere",
        "khedma", "nekhdem",
    ),
    "list": (
        "formations", "formation", "programmes", "programme", "filieres", "filiere",
        "parcours", "liste", "specialites", "proposez",
    ),
    "human": ("conseiller", "humain", "rendez-vous", "rdv", "telephone", "contacter", "contact"),
    "greeting": (
        "bonjour", "salut", "salam", "aslema", "ahla", "bonsoir", "hello", "hi", "marhba",
    ),
}

ARABIZI_MARKERS = (
    "nheb", "n7eb", "chnowa", "chnoua", "chniya", "chneya", "barcha", "mta3", "3andi",
    "kifech", "kifeh", "9adeh", "9adech", "na9ra", "nekra", "ya5i", "a3tini", "famma",
    "fama", "wela", "inti", "enti", "aslema", "behi", "mouch", "mich",
)

# Mots trop génériques pour identifier une formation précise.
_STOP_WORDS = {
    "cycle", "ingenieur", "ingenieurs", "licence", "master", "genie", "sciences", "science",
    "des", "les", "une", "pour", "avec", "aux", "etudes", "formation", "programme",
    "integre", "integree", "appliquee", "appliquees", "institut", "international",
}


@dataclass
class AssistantReply:
    content: str
    intent: str
    language_detected: str
    program_codes: list[str] = field(default_factory=list)
    generator: str = GENERATOR_NAME


def detect_language(text: str) -> str:
    raw = text.lower()
    if any("؀" <= ch <= "ۿ" for ch in raw):
        return "ar_tn"
    norm = normalize(text)
    if any(contains_word(norm, marker) for marker in ARABIZI_MARKERS):
        return "arabizi"
    return "fr"


def detect_intents(text: str) -> list[str]:
    norm = normalize(text)
    return [intent for intent, words in INTENT_KEYWORDS.items() if any(contains_word(norm, w) for w in words)]


def _program_tokens(program: AcademicProgram) -> set[str]:
    words = normalize(f"{program.program_name} {program.program_domain or ''}").split()
    return {w.strip(".,;:()'’") for w in words if len(w) >= 4 and w not in _STOP_WORDS}


# Mot-clé -> type de formation (program_type) pour filtrer « master finance », « licence info »...
TYPE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Master": ("master", "masters", "mastere", "masteres"),
    "Licence": ("licence", "licences"),
    "Cycle ingénieur": ("ingenieur", "ingenieurs", "cycle ingenieur"),
    "Cycle préparatoire": ("prepa", "prepas", "preparatoire"),
}


def _detect_types(norm: str) -> set[str]:
    return {t for t, words in TYPE_KEYWORDS.items() if any(contains_word(norm, w) for w in words)}


def match_programs(
    programs: list[AcademicProgram],
    text: str,
    interests: list[str],
    institution: str | None,
    use_memory: bool = True,
) -> list[AcademicProgram]:
    """
    Formations citées dans le message (code, mots du nom/domaine), filtrées par
    établissement et type si mentionnés. Si rien n'est cité et `use_memory`,
    on se rabat sur les centres d'intérêt mémorisés (SA-26).
    """
    norm = normalize(text)
    types = _detect_types(norm)
    pool = [p for p in programs if not institution or p.institution.institution_code == institution]
    if types:
        typed = [p for p in pool if p.program_type in types]
        pool = typed or pool

    by_code = [p for p in pool if p.program_code.lower() in norm]
    if by_code:
        return by_code

    scored = []
    for program in pool:
        score = sum(1 for token in _program_tokens(program) if contains_word(norm, token))
        if score:
            scored.append((score, program))
    if scored:
        best = max(score for score, _ in scored)
        return [p for score, p in scored if score == best]

    if use_memory and interests:
        return [p for p in pool if p.program_domain in interests]
    if types or institution:
        # « les masters de l'ISB » : le filtre suffit à désigner des formations.
        return pool if len(pool) < len(programs) else []
    return []


def _detect_institution(text: str) -> str | None:
    norm = normalize(text)
    has_iit, has_isb = contains_word(norm, "iit"), contains_word(norm, "isb")
    if has_iit and not has_isb:
        return "IIT"
    if has_isb and not has_iit:
        return "ISB"
    return None


NBSP = "\u00a0"  # espace insécable : « 7 200 TND » ne se coupe pas en fin de ligne


def _fmt_amount(value) -> str:
    # Format français : 1 234,5 (séparateur de milliers insécable, virgule décimale).
    text = f"{value:,.3f}".rstrip("0").rstrip(".")
    return text.replace(",", NBSP).replace(".", ",")


def _fees_lines(program: AcademicProgram) -> list[str]:
    published = [f for f in program.fees if (f.fee_status or "").lower() == "published"]
    if not published:
        return [f"• {program.program_name} : tarif non publié pour le moment."]
    lines = []
    for fee in published:
        amount = f"{_fmt_amount(fee.fee_amount)}{NBSP}{fee.fee_currency}" if fee.fee_amount is not None else "montant à confirmer"
        period = f" / {fee.fee_period}" if fee.fee_period else ""
        year = f" ({fee.fee_academic_year})" if fee.fee_academic_year else ""
        lines.append(f"• {program.program_name} — {fee.fee_category} : {amount}{period}{year}")
    return lines


def _admission_lines(program: AcademicProgram) -> list[str]:
    if not program.admission_requirements:
        return [f"• {program.program_name} : conditions non renseignées dans le catalogue."]
    lines = [f"• {program.program_name} :"]
    for req in program.admission_requirements:
        if req.required_diploma:
            lines.append(f"   – Diplôme requis : {req.required_diploma}")
        if req.admission_process:
            lines.append(f"   – Procédure : {req.admission_process}")
        if req.required_documents:
            lines.append(f"   – Pièces : {req.required_documents}")
        if req.additional_conditions:
            lines.append(f"   – Autres conditions : {req.additional_conditions}")
    return lines


def _careers_lines(program: AcademicProgram) -> list[str]:
    if not program.careers:
        return [f"• {program.program_name} : débouchés non renseignés."]
    titles = ", ".join(c.career_job_title for c in program.careers[:5])
    return [f"• {program.program_name} : {titles}"]


def _program_summary(program: AcademicProgram) -> str:
    parts = [f"• {program.program_name} ({program.institution.institution_code}"]
    if program.program_duration:
        parts.append(f", {program.program_duration}")
    parts.append(")")
    return "".join(parts)


async def load_catalog(db: AsyncSession) -> list[AcademicProgram]:
    return list((await db.scalars(
        select(AcademicProgram)
        .options(
            selectinload(AcademicProgram.institution),
            selectinload(AcademicProgram.fees),
            selectinload(AcademicProgram.admission_requirements),
            selectinload(AcademicProgram.careers),
        )
        .order_by(AcademicProgram.program_name)
    )).all())


async def generate_reply(db: AsyncSession, memory: dict, user_text: str) -> AssistantReply:
    """Produire la réponse de l'assistant provisoire pour `user_text`."""
    language = detect_language(user_text)
    intents = detect_intents(user_text)
    previous_user_texts = [m["content"] for m in memory.get("messages", []) if m["role"] == "user"]
    hints = extract_profile_hints(previous_user_texts + [user_text])
    institution = _detect_institution(user_text)

    programs = await load_catalog(db)
    if not programs:
        return AssistantReply(
            content=(
                "Le catalogue des formations est vide pour le moment. "
                "Un administrateur doit d'abord l'alimenter (script scripts/seed_demo.py en développement)."
            ),
            intent="catalog_empty",
            language_detected=language,
        )

    # La mémoire n'est utilisée que pour compléter une question précise
    # (« combien ça coûte ? ») et jamais pour un message incompris.
    wants_details = bool({"fees", "admission", "careers"} & set(intents))
    matched = match_programs(
        programs, user_text, hints["interests"], institution, use_memory=wants_details
    )
    lines: list[str] = []
    intent = "fallback"

    if "human" in intents:
        intent = "human"
        lines.append(
            "Je peux vous mettre en relation avec un conseiller : créez votre compte candidat, "
            "puis demandez un rendez-vous depuis votre espace. Un responsable des admissions "
            "valide toujours les décisions officielles."
        )
    elif "fees" in intents:
        intent = "fees"
        targets = matched or programs
        lines.append("Voici les frais publiés dans le catalogue :" if matched else
                     "Voici les frais publiés pour l'ensemble des formations :")
        for program in targets[:6]:
            lines.extend(_fees_lines(program))
        if not matched:
            lines.append("Dites-moi quelle formation vous intéresse pour un détail plus précis.")
    elif "admission" in intents:
        intent = "admission"
        if matched:
            lines.append("Conditions d'admission enregistrées :")
            for program in matched[:4]:
                lines.extend(_admission_lines(program))
        else:
            lines.append(
                "Les conditions dépendent de la formation. Pour quelle formation souhaitez-vous "
                "les connaître ? Par exemple : « conditions d'admission en génie informatique »."
            )
    elif "careers" in intents and matched:
        intent = "careers"
        lines.append("Débouchés indiqués dans le catalogue :")
        for program in matched[:4]:
            lines.extend(_careers_lines(program))
    elif matched:
        intent = "program_info"
        for program in matched[:3]:
            lines.append(_program_summary(program))
            if program.program_description:
                lines.append(f"   {program.program_description}")
        lines.append("Souhaitez-vous connaître les frais, les conditions d'admission ou les débouchés ?")
    elif "list" in intents or "greeting" in intents:
        intent = "list" if "list" in intents else "greeting"
        if intent == "greeting":
            lines.append("Bonjour et bienvenue sur SmartCampus AI !")
        pool = [p for p in programs if not institution or p.institution.institution_code == institution]
        lines.append("Formations disponibles dans le catalogue :")
        lines.extend(_program_summary(p) for p in pool[:12])
        lines.append(
            "Parlez-moi de votre niveau (bac, prépa, licence…) et de ce qui vous intéresse : "
            "je vous orienterai vers les parcours adaptés."
        )
    else:
        lines.append(
            "Je n'ai pas encore compris votre demande. Je peux vous renseigner sur les formations "
            "IIT et ISB, leurs frais, leurs conditions d'admission et leurs débouchés. "
            "Exemple : « Quels sont les frais du cycle ingénieur en génie informatique ? »"
        )

    if hints["interests"] and intent in ("fallback", "greeting", "list"):
        lines.append(f"(Je retiens votre intérêt pour : {', '.join(hints['interests'])}.)")

    if language != "fr":
        lines.append(
            "ℹ️ Réponse en français : la compréhension complète du tunisien et de l'Arabizi "
            "arrivera avec l'agent IA."
        )

    codes = [p.program_code for p in matched[:6]]
    if codes:
        lines.append(f"Source : catalogue SmartCampus ({', '.join(codes)}).")

    return AssistantReply(
        content="\n".join(lines),
        intent=intent,
        language_detected=language,
        program_codes=codes,
    )
