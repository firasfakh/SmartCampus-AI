# 🎓 SmartCampus AI — Backend API

**Plateforme intelligente de gestion des candidats, des demandes administratives et des conversations avec un assistant IA.**

Développé par l'équipe **FYKEK — Groupe 3** dans le cadre du sujet Intelligence Artificielle Générative.

---

## 📋 Table des matières

- [Présentation](#présentation)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [Migrations de base de données](#migrations-de-base-de-données)
- [Tests](#tests)
- [Documentation API](#documentation-api)
- [Architecture du projet](#architecture-du-projet)
- [Domaines fonctionnels](#domaines-fonctionnels)

---

## 🎯 Présentation

SmartCampus AI est une API REST construite avec **FastAPI** qui fournit :

- **Authentification** sécurisée avec JWT et gestion des rôles (visiteur, candidat, responsable).
- **Gestion des candidats** : profils, dossiers et suivi.
- **Conversations IA** : échange de messages avec un assistant intelligent.
- **Gestion documentaire** : téléversement, consultation et téléchargement de documents.
- **Demandes d'équivalence** : soumission et traitement des demandes.
- **Préinscriptions** : création et suivi des dossiers de préinscription.
- **Rendez-vous** : planification et gestion des rendez-vous.
- **Entretiens** : organisation et suivi des entretiens.

---

## ✅ Prérequis

- **Python** 3.11 ou supérieur
- **PostgreSQL** 14 ou supérieur
- **pip** (gestionnaire de paquets Python)

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone <url-du-repository>
cd SmartCampus\ AI/backend
```

### 2. Créer un environnement virtuel

```bash
python -m venv venv
```

### 3. Activer l'environnement virtuel

**Windows :**
```bash
venv\Scripts\activate
```

**Linux / macOS :**
```bash
source venv/bin/activate
```

### 4. Installer les dépendances

```bash
pip install -r requirements.txt
```

---

## ⚙️ Configuration

### 1. Créer le fichier de configuration

```bash
cp .env.example .env
```

### 2. Configurer les variables d'environnement

Modifier le fichier `.env` avec vos paramètres :

| Variable | Description | Valeur par défaut |
|---|---|---|
| `POSTGRES_HOST` | Hôte PostgreSQL | `localhost` |
| `POSTGRES_PORT` | Port PostgreSQL | `5432` |
| `POSTGRES_USER` | Utilisateur PostgreSQL | `smartcampus` |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | — |
| `POSTGRES_DB` | Nom de la base de données | `smartcampus_db` |
| `SECRET_KEY` | Clé secrète JWT | — |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée de validité du token | `30` |

### 3. Créer la base de données PostgreSQL

```sql
CREATE USER smartcampus WITH PASSWORD 'votre_mot_de_passe';
CREATE DATABASE smartcampus_db OWNER smartcampus;
```

---

## ▶️ Lancement

### Démarrer le serveur de développement

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Le serveur sera accessible sur : `http://localhost:8000`

---

## 🗃️ Migrations de base de données

### Initialiser Alembic (première fois)

```bash
alembic init alembic
```

### Créer une migration

```bash
alembic revision --autogenerate -m "description de la migration"
```

### Appliquer les migrations

```bash
alembic upgrade head
```

### Annuler la dernière migration

```bash
alembic downgrade -1
```

---

## 🧪 Tests

### Exécuter tous les tests

```bash
pytest
```

### Exécuter les tests avec le détail

```bash
pytest -v
```

### Exécuter les tests avec la couverture

```bash
pytest --cov=app
```

---

## 📖 Documentation API

Une fois le serveur lancé, la documentation est accessible sur :

| Documentation | URL |
|---|---|
| **Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
| **OpenAPI JSON** | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) |

---

## 📁 Architecture du projet

```
backend/
│
├── app/
│   ├── main.py                  # Point d'entrée FastAPI
│   │
│   ├── core/                    # Configuration, sécurité, exceptions
│   │   ├── config.py            # Paramètres de l'application
│   │   ├── security.py          # JWT, hashage, rôles
│   │   └── exceptions.py        # Gestion centralisée des erreurs
│   │
│   ├── api/v1/                  # Routes API versionnées
│   │   ├── router.py            # Routeur principal v1
│   │   └── endpoints/           # Endpoints par domaine
│   │       ├── auth.py          # Authentification
│   │       ├── candidates.py    # Candidats
│   │       ├── conversations.py # Conversations IA
│   │       ├── documents.py     # Documents
│   │       ├── equivalences.py  # Demandes d'équivalence
│   │       ├── pre_registrations.py # Préinscriptions
│   │       ├── appointments.py  # Rendez-vous
│   │       └── interviews.py    # Entretiens
│   │
│   ├── models/                  # Modèles SQLAlchemy (ORM)
│   ├── schemas/                 # Schémas Pydantic (validation)
│   ├── services/                # Logique métier
│   ├── repositories/            # Accès aux données
│   ├── database/                # Connexion PostgreSQL
│   │   ├── connection.py        # Moteur et sessions
│   │   └── base.py              # Base déclarative
│   └── utils/                   # Utilitaires
│
├── tests/                       # Tests automatisés
│   ├── conftest.py              # Fixtures Pytest
│   ├── test_main.py             # Tests application principale
│   ├── test_api_routes.py       # Tests routes API
│   └── test_errors.py           # Tests gestion erreurs
│
├── .env.example                 # Template des variables d'environnement
├── .gitignore                   # Fichiers ignorés par Git
├── requirements.txt             # Dépendances Python
└── README.md                    # Ce fichier
```

---

## 🏗️ Domaines fonctionnels

Conformément aux spécifications SA-3, SA-4 et SA-5 :

| Domaine | Préfixe API | Description |
|---|---|---|
| Authentification | `/api/v1/auth` | Inscription, connexion, gestion des sessions |
| Candidats | `/api/v1/candidates` | Profils et données des candidats |
| Conversations | `/api/v1/conversations` | Échanges avec l'assistant IA |
| Documents | `/api/v1/documents` | Gestion documentaire |
| Équivalences | `/api/v1/equivalences` | Demandes d'équivalence |
| Préinscriptions | `/api/v1/pre-registrations` | Dossiers de préinscription |
| Rendez-vous | `/api/v1/appointments` | Planification de rendez-vous |
| Entretiens | `/api/v1/interviews` | Organisation des entretiens |

### Rôles et permissions (SA-3)

| Rôle | Description |
|---|---|
| **Visiteur** | Accès public uniquement (inscription, connexion) |
| **Candidat** | Accès à ses propres données et dossiers |
| **Responsable** | Gestion et traitement des dossiers |

---

## 📝 Licence

Projet académique — FYKEK Groupe 3.
