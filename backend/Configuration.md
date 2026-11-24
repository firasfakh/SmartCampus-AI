# 🛠️ SmartCampus AI — Development Guide

Ce document explique comment installer, configurer et lancer SmartCampus AI dans un environnement de développement local.

## 1. Prérequis

| Technologie | Version recommandée |
|---|---|
| Python | 3.13 |
| Node.js | 24+ |
| npm | 10+ |
| PostgreSQL | 16 |
| Git | Latest |

## 2. Récupération du projet

```bash
git clone <URL_DU_REPOSITORY>
cd SmartCampus-AI
```

## 3. Configuration du Backend

### Créer l'environnement virtuel

```bash
cd backend
py -3.13 -m venv .venv
```

### Activer l'environnement

Windows PowerShell :

```powershell
.venv\Scripts\Activate.ps1
```

Linux / macOS :

```bash
source .venv/bin/activate
```

### Installer les dépendances

```bash
pip install -r requirements.txt
```

## 4. Configuration PostgreSQL

Chaque développeur doit disposer de sa propre base PostgreSQL.

### Créer l'utilisateur et la base

```sql
CREATE USER smartcampus WITH PASSWORD 'your_password';
CREATE DATABASE smartcampus_db OWNER smartcampus;
```

### Configurer les variables d'environnement

Copier `.env.example` vers `.env` dans le dossier `backend`.

Configurer les variables :

```env
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_USER=smartcampus
POSTGRES_PASSWORD=your_password
POSTGRES_DB=smartcampus_db
```

**Important :** adapter le port et les identifiants selon l'installation PostgreSQL locale.

Ne jamais partager ou committer le fichier `.env`.

## 5. Lancement du Backend

Depuis le dossier `backend` :

```bash
uvicorn app.main:app --reload
```

- API : http://127.0.0.1:8000
- Swagger : http://127.0.0.1:8000/docs
- ReDoc : http://127.0.0.1:8000/redoc

## 6. Configuration du Frontend

Ouvrir un deuxième terminal :

```bash
cd frontend
npm install
```

### Démarrer le Frontend

```bash
npm run dev
```

Interface : http://localhost:5173

## 7. Organisation des terminaux

Pour travailler localement, conserver deux terminaux ouverts :

| Terminal | Application | Commande |
|---|---|---|
| Terminal 1 | Backend | `uvicorn app.main:app --reload` |
| Terminal 2 | Frontend | `npm run dev` |

PostgreSQL doit également être démarré.

## 8. Workflow Git

Avant de commencer une tâche :

```bash
git pull origin main
```

Créer une branche pour son travail :

```bash
git checkout -b feature/nom-de-la-fonctionnalite
```

Après les modifications :

```bash
git add .
git commit -m "feat: description de la fonctionnalite"
git push origin feature/nom-de-la-fonctionnalite
```

## 9. Bonnes pratiques

- Ne jamais committer `.env`.
- Ne jamais committer `.venv/` ou `node_modules/`.
- Toujours travailler avec un environnement virtuel.
- Installer les dépendances à partir des fichiers de configuration partagés.
- Tester les modifications avant de pousser.
- Documenter les nouvelles fonctionnalités.

---

**SmartCampus AI — FYKEK Groupe 3**