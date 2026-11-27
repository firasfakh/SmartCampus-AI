# SA-7, SA-8 et SA-9 — Initialisation et environnement local

Le guide complet (Windows `cmd`) est dans [`backend/Configuration.md`](../backend/Configuration.md).

Résumé :

```cmd
:: 1. Base (racine du dépôt)
docker compose up -d db

:: 2. Backend
cd backend
py -3.12 -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m scripts.seed_demo
uvicorn app.main:app --reload

:: 3. Frontend (autre terminal)
cd frontend
npm ci
copy .env.example .env
npm run dev
```

| Élément | Valeur par défaut |
|---|---|
| PostgreSQL (Docker) | `127.0.0.1:5433`, `smartcampus` / `smartcampus_dev_only`, base `smartcampus_db` |
| Base de test | `smartcampus_test` (créée automatiquement au premier `docker compose up`) |
| API | `http://localhost:8000` — Swagger `/docs`, santé `/health` |
| Frontend | `http://localhost:5173` (`VITE_API_URL=http://localhost:8000/api/v1`) |

Le port de `backend/.env` (`POSTGRES_PORT`) doit correspondre à celui de Docker (5433) ou de
votre PostgreSQL local (5432). Ne jamais committer de fichier `.env`.
