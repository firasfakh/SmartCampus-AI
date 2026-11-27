"""
SA-18 — Alimenter la base avec des données de DÉMONSTRATION.

Crée (ou met à jour, le script est idempotent) :
- les établissements IIT et ISB ;
- les 9 formations du fichier scripts/data/demo_catalog.json
  (mêmes données que frontend/src/data/officialPrograms.ts) ;
- leurs frais de scolarité, conditions d'admission et débouchés ;
- des comptes de démonstration pour chaque rôle.

Usage (depuis le dossier backend, venv activé, après `alembic upgrade head`) :
    python -m scripts.seed_demo
    python -m scripts.seed_demo --no-accounts      # catalogue seulement

Mot de passe des comptes de démo : variable DEMO_PASSWORD (12 caractères min.),
sinon « SmartCampus2026! ». Refusé si ENVIRONMENT=production.

⚠️ Les montants et conditions sont des données de démonstration : à vérifier
auprès de l'administration avant toute communication officielle.
"""

import argparse
import json
import os
import sys
from decimal import Decimal
from pathlib import Path

from sqlalchemy import create_engine, delete, func, select
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings  # noqa: E402
from app.core.security import hash_password, password_policy_error  # noqa: E402
from app.models import (  # noqa: E402
    AcademicInstitution,
    AcademicProgram,
    AdmissionRequirement,
    CandidateProfile,
    CareerOpportunity,
    ProgramFee,
    ResponsibleAssignment,
    UserAccount,
    program_careers,
)

DATA_FILE = Path(__file__).with_name("data") / "demo_catalog.json"
ACADEMIC_YEAR = "2026-2027"
DEMO_NOTE = (
    "Donnée de démonstration (SA-18) — à vérifier auprès de l'administration "
    "avant toute communication officielle."
)

DEMO_ACCOUNTS = [
    # (email, rôle, établissement, prénom, nom)
    ("admin@smartcampus.example", "admin", None, None, None),
    ("resp.iit@smartcampus.example", "responsable_academique", "IIT", None, None),
    ("resp.isb@smartcampus.example", "responsable_academique", "ISB", None, None),
    ("entretien.iit@smartcampus.example", "responsable_entretien", "IIT", None, None),
    ("direction@smartcampus.example", "direction", None, None, None),
    ("candidat@smartcampus.example", "candidate", None, "Amine", "Candidat"),
]


def upsert_institutions(db: Session, data: dict) -> dict[str, AcademicInstitution]:
    result = {}
    for item in data["institutions"]:
        inst = db.scalar(select(AcademicInstitution).where(AcademicInstitution.institution_code == item["code"]))
        if inst is None:
            inst = AcademicInstitution(institution_code=item["code"], institution_name=item["name"])
            db.add(inst)
        else:
            inst.institution_name = item["name"]
        result[item["code"]] = inst
    db.flush()
    return result


def _career(db: Session, title: str) -> CareerOpportunity:
    career = db.scalar(select(CareerOpportunity).where(CareerOpportunity.career_job_title == title))
    if career is None:
        career = CareerOpportunity(career_job_title=title)
        db.add(career)
        db.flush()
    return career


def upsert_programs(db: Session, data: dict, institutions: dict) -> int:
    for item in data["programs"]:
        description = item["description"]
        if item.get("highlights"):
            description += "\nPoints forts : " + " ; ".join(item["highlights"]) + "."

        program = db.scalar(select(AcademicProgram).where(AcademicProgram.program_code == item["code"]))
        if program is None:
            program = AcademicProgram(program_code=item["code"])
            db.add(program)
        program.institution_id = institutions[item["institution"]].id
        program.program_name = item["name"]
        program.program_type = item["type"]
        program.program_domain = item["domain"]
        program.teaching_language = item["language"]
        program.program_duration = item["duration"]
        program.program_description = description
        db.flush()

        # Données dépendantes : on remplace celles de la démo (idempotence).
        db.execute(delete(ProgramFee).where(ProgramFee.program_id == program.id))
        db.execute(delete(AdmissionRequirement).where(AdmissionRequirement.program_id == program.id))
        db.execute(delete(program_careers).where(program_careers.c.program_id == program.id))

        db.add(ProgramFee(
            program_id=program.id,
            fee_category="Frais de scolarité",
            fee_amount=Decimal(str(item["tuition_tnd"])),
            fee_currency="TND",
            fee_period="année",
            fee_academic_year=ACADEMIC_YEAR,
            fee_status="published",
            fee_notes=DEMO_NOTE,
        ))
        if item.get("prerequisites"):
            db.add(AdmissionRequirement(
                program_id=program.id,
                required_diploma=" ; ".join(item["prerequisites"]),
                additional_conditions=DEMO_NOTE,
            ))
        for title in item.get("careers", []):
            career = _career(db, title)
            db.execute(program_careers.insert().values(program_id=program.id, career_id=career.id))
        db.flush()
    return len(data["programs"])


def upsert_accounts(db: Session, institutions: dict, password: str) -> list[str]:
    created = []
    for email, role, inst_code, first_name, last_name in DEMO_ACCOUNTS:
        user = db.scalar(select(UserAccount).where(func.lower(UserAccount.email) == email))
        if user is None:
            user = UserAccount(email=email, password_hash=hash_password(password), role=role)
            db.add(user)
            db.flush()
            created.append(email)
        if role == "candidate" and db.get(CandidateProfile, user.id) is None:
            db.add(CandidateProfile(user_id=user.id, first_name=first_name, last_name=last_name))
        if inst_code:
            current = db.scalar(select(ResponsibleAssignment).where(
                ResponsibleAssignment.user_id == user.id, ResponsibleAssignment.ended_at.is_(None)
            ))
            if current is None:
                db.add(ResponsibleAssignment(
                    user_id=user.id, institution_id=institutions[inst_code].id, role=role
                ))
        db.flush()
    return created


def main() -> None:
    parser = argparse.ArgumentParser(description="SA-18 : données de démonstration SmartCampus AI")
    parser.add_argument("--no-accounts", action="store_true", help="ne pas créer les comptes de démo")
    args = parser.parse_args()

    if settings.ENVIRONMENT == "production":
        raise SystemExit("Refusé : ce script de démonstration ne s'exécute pas en production.")

    password = os.environ.get("DEMO_PASSWORD", "SmartCampus2026!")
    if len(password) < 12 or password_policy_error(password):
        raise SystemExit("DEMO_PASSWORD doit contenir au moins 12 caractères, une lettre et un chiffre.")

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    engine = create_engine(settings.DATABASE_URL_SYNC)
    with Session(engine) as db, db.begin():
        institutions = upsert_institutions(db, data)
        count = upsert_programs(db, data, institutions)
        created = [] if args.no_accounts else upsert_accounts(db, institutions, password)
    engine.dispose()

    print(f"✔ Catalogue : {len(institutions)} établissements, {count} formations (frais, conditions, débouchés).")
    if not args.no_accounts:
        print(f"✔ Comptes de démonstration ({len(created)} créé(s), les existants sont conservés) :")
        for email, role, inst, *_ in DEMO_ACCOUNTS:
            print(f"   {email:<36} {role}{' (' + inst + ')' if inst else ''}")
        if created:
            print(f"   Mot de passe des comptes créés : {password}")
    print("⚠  Données de démonstration : à vérifier avant toute communication officielle.")


if __name__ == "__main__":
    main()
