# SmartCampus AI — Plateforme agentique d'orientation IIT / ISB

Projet n°3 « IA générative » — 3ᵉ année Génie Informatique, IIT — équipe **FYKEK, Groupe 3**.

| Dossier | Contenu |
|---|---|
| `backend/` | API FastAPI + PostgreSQL ([README](backend/README.md), [installation](backend/Configuration.md)) |
| `frontend/` | Interface React + TypeScript + Vite + Tailwind |
| `docs/` | Architecture, contrat d'API, modèle de données, tests, flux visiteur → candidat |
| `docker-compose.yml` | PostgreSQL 16 + pgvector (et backend en option) |

## Démarrage (Windows `cmd`, après la première installation)

```cmd
docker compose up -d db
cd backend
.venv\Scripts\activate.bat
alembic upgrade head
python -m scripts.seed_demo
uvicorn app.main:app --reload
```

Dans un autre terminal :

```cmd
cd frontend
npm run dev
```

Première installation (venv, fichiers `.env`, base de test) : voir **[backend/Configuration.md](backend/Configuration.md)**.

- Frontend : http://localhost:5173
- API / Swagger : http://localhost:8000/docs
- Comptes de démo : `*@smartcampus.example`, mot de passe `SmartCampus2026!` (liste dans Configuration.md)

## État d'avancement (SA-1 → SA-29)
Le détail de ce qui a été vérifié et corrigé est dans **[RAPPORT-CORRECTIONS-SA1-SA29.md](RAPPORT-CORRECTIONS-SA1-SA29.md)**.
