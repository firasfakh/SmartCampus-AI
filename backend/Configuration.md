# 🛠️ SmartCampus AI — Guide d'installation locale (SA-7 / SA-8 / SA-9)

Commandes écrites pour l'invite de commandes Windows (`cmd`). Sous macOS / Linux, remplacer
`copy` par `cp` et `.venv\Scripts\activate.bat` par `source .venv/bin/activate`.

## 1. Prérequis

| Outil | Version |
|---|---|
| Python | 3.12 ou 3.13 |
| Node.js / npm | 20+ / 10+ |
| PostgreSQL | 16 — via **Docker Desktop** (recommandé) ou installé localement |
| Git | récent |

## 2. Base de données

### Option A — Docker (recommandé)
Depuis la **racine** du dépôt :

```cmd
docker compose up -d db
docker compose ps
```

Attendre l'état `healthy`. La base écoute sur **127.0.0.1:5433** avec
`smartcampus / smartcampus_dev_only`, base `smartcampus_db`. Au premier démarrage,
la base de test `smartcampus_test` est créée automatiquement (`docker/postgres-init/`).

> Volume déjà créé avant cette version ? Créer la base de test une fois :
> `docker exec -it smartcampus-postgres createdb -U smartcampus smartcampus_test`

### Option B — PostgreSQL installé sur Windows
Dans pgAdmin ou `psql -U postgres` :

```sql
CREATE USER smartcampus WITH PASSWORD 'smartcampus_dev_only';
CREATE DATABASE smartcampus_db OWNER smartcampus;
CREATE DATABASE smartcampus_test OWNER smartcampus;
```

Puis mettre `POSTGRES_PORT=5432` dans `backend\.env`.

## 3. Backend

```cmd
cd backend
py -3.12 -m venv .venv
.venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
```

Dans `.env`, remplacer `SECRET_KEY` par une clé générée :

```cmd
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Créer les tables, puis charger les données de démonstration (SA-18) :

```cmd
alembic upgrade head
python -m scripts.seed_demo
uvicorn app.main:app --reload
```

- API : http://127.0.0.1:8000 — santé : http://127.0.0.1:8000/health
- Swagger : http://127.0.0.1:8000/docs (bouton **Authorize** : coller le `access_token` reçu au login)

Comptes de démonstration créés par le seed (mot de passe `SmartCampus2026!`, modifiable avec la
variable `DEMO_PASSWORD`) :

| E-mail | Rôle |
|---|---|
| `admin@smartcampus.example` | admin |
| `resp.iit@smartcampus.example` | responsable académique IIT |
| `resp.isb@smartcampus.example` | responsable académique ISB |
| `entretien.iit@smartcampus.example` | responsable entretiens IIT |
| `direction@smartcampus.example` | direction |
| `candidat@smartcampus.example` | candidat |

Premier administrateur sur une base **réelle** (sans données de démo) :

```cmd
set BOOTSTRAP_ADMIN_EMAIL=prenom.nom@domaine.tn
set BOOTSTRAP_ADMIN_PASSWORD=UnMotDePasseLong2026
python -m scripts.create_admin
```

## 4. Frontend

Dans un second terminal :

```cmd
cd frontend
npm ci
copy .env.example .env
npm run dev
```

Interface : http://localhost:5173. `VITE_API_URL` doit pointer vers le backend
(`http://localhost:8000/api/v1` avec uvicorn).

## 5. Tests (SA-22)

```cmd
cd backend
python -m pytest -q
```

- Les tests unitaires ne nécessitent pas PostgreSQL.
- Les tests d'intégration utilisent **uniquement** la base `smartcampus_test` (même hôte, port et
  utilisateur que `.env`). Si elle n'existe pas, ils sont ignorés avec un message explicite.
- Le test historique SA-12 est interactif : `set RUN_SA12_MANUAL=1` puis
  `python -m pytest tests/test_sa12_functional.py -s`.

Frontend : `npm run build` (vérification TypeScript + build de production).

## 6. Backend dans Docker (optionnel)

```cmd
docker compose --profile full up -d --build
```

Le conteneur applique `alembic upgrade head` au démarrage puis lance l'API sur le port 8000.

## 7. Workflow Git

```cmd
git switch votre-branche
git pull origin main
:: ... travail ...
git add .
git commit -m "SA-xx: description"
git push
```

Ouvrir une pull request vers `main` à la fin de chaque story.

## 8. Bonnes pratiques

- Ne jamais committer `.env`, `.venv/`, `venv/`, `node_modules/`.
- Ne jamais modifier une migration déjà appliquée : créer une nouvelle révision
  (`alembic revision --autogenerate -m "..."`), la relire, puis vérifier avec `alembic check`.
- Les données de `scripts/data/demo_catalog.json` sont des **données de démonstration** :
  à vérifier auprès de l'administration avant toute communication officielle.

---

**SmartCampus AI — FYKEK Groupe 3**
