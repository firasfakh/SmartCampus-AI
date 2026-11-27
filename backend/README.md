# 🎓 SmartCampus AI — Backend API

API **FastAPI** de la plateforme d'orientation et d'admission IIT / ISB — équipe **FYKEK, Groupe 3**.

- Installation et lancement : **[Configuration.md](Configuration.md)**
- Architecture et contrat d'API : [`../docs/SA-03-05-architecture-and-api.md`](../docs/SA-03-05-architecture-and-api.md)
- Visiteurs, mémoire, authentification, rattachement : [`../docs/SA-23-29-visiteurs-memoire-auth.md`](../docs/SA-23-29-visiteurs-memoire-auth.md)

## Démarrage rapide

```cmd
docker compose up -d db              :: depuis la racine du dépôt
cd backend
.venv\Scripts\activate.bat
alembic upgrade head
python -m scripts.seed_demo          :: données de démonstration (SA-18)
uvicorn app.main:app --reload        :: http://localhost:8000/docs
python -m pytest -q                  :: tests (SA-22)
```

## Pile technique
Python 3.12/3.13 · FastAPI · Pydantic v2 · SQLAlchemy 2 asynchrone (asyncpg) · Alembic ·
PostgreSQL 16 (+ pgvector via Docker) · JWT (python-jose) · bcrypt (passlib).

## Structure

```
backend/
├── app/
│   ├── main.py                   # Application, CORS, purge périodique des sessions visiteurs
│   ├── core/
│   │   ├── config.py             # Paramètres (.env) — voir .env.example
│   │   ├── security.py           # bcrypt, JWT, rôles, RoleChecker, jeton visiteur
│   │   └── exceptions.py         # Format d'erreur uniforme {success:false, error:{code,message}}
│   ├── api/v1/endpoints/
│   │   ├── auth.py               # SA-28 : inscription, connexion, /me, comptes internes (admin)
│   │   ├── sessions.py           # SA-25 / SA-29 : session visiteur, rattachement
│   │   ├── conversations.py      # SA-24 / SA-26 : conversations, messages, mémoire
│   │   ├── catalog.py            # SA-20 / SA-21 : formations, frais, établissements
│   │   └── candidates.py, pre_registrations.py, documents.py, ...   # sprints suivants
│   ├── services/
│   │   ├── visitor_sessions.py   # jetons hachés, limites, rattachement, purge
│   │   ├── memory.py             # fenêtre de messages + indices de profil
│   │   └── assistant.py          # assistant PROVISOIRE (règles + catalogue) — à remplacer par l'agent IA
│   ├── models/                   # SQLAlchemy (SA-12 catalogue, SA-13 comptes/dossiers, SA-14 documents)
│   └── database/                 # moteur asynchrone, sessions
├── alembic/versions/             # sa12_catalog_001 → 16862e4a9d1a → e0a55cf7d534 → sa14_align_001
├── scripts/
│   ├── seed_demo.py              # SA-18 (idempotent)
│   ├── data/demo_catalog.json    # données de démonstration
│   └── create_admin.py           # premier administrateur d'une base réelle
└── tests/                        # unitaires + intégration PostgreSQL (base smartcampus_test)
```

## Rôles

| Rôle (base) | Création | Périmètre |
|---|---|---|
| `candidate` | inscription publique | ses propres données et conversations |
| `responsable_academique` | admin + établissement (IIT/ISB) | catalogue de son établissement |
| `responsable_entretien` | admin + établissement | entretiens (sprints suivants) |
| `direction` | admin | indicateurs (sprints suivants) |
| `admin` | `scripts/create_admin.py` puis admin | comptes, rôles, catalogue |
