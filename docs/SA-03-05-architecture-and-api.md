# FYKEK / SmartCampus AI — SA-3, SA-4 et SA-5

## SA-3 — Acteurs et processus métier

### Acteurs
| Acteur | Accès principal | Actions |
|---|---|---|
| Visiteur sans compte | Public | Consulter le catalogue public, ouvrir une conversation, créer une session visiteur |
| Candidat identifié | Espace candidat | Gérer son profil, ses préinscriptions, ses documents et ses conversations |
| Responsable académique | Espace institution | Consulter et traiter les dossiers relevant de son périmètre, gérer le catalogue si autorisé |
| Responsable des entretiens | Espace entretiens | Consulter les dossiers affectés, planifier et évaluer les entretiens |
| Direction | Pilotage | Consulter les indicateurs et décisions autorisés |
| Administrateur | Administration | Gérer les comptes, paramètres et habilitations |

### Processus métier
1. Découverte publique : visiteur consulte les formations et démarre une conversation sans compte.
2. Orientation : l'assistant collecte les informations utiles et conserve le fil dans une session visiteur.
3. Inscription : le visiteur crée un compte candidat et vérifie son adresse e-mail selon le mécanisme activé par l'établissement.
4. Rattachement : après authentification, le candidat donne son accord explicite ; le backend vérifie la propriété de la session puis rattache les conversations.
5. Préinscription : le candidat crée un dossier, complète son profil, fournit les pièces et soumet le dossier.
6. Traitement : les responsables habilités vérifient le dossier, demandent des compléments et enregistrent une décision.
7. Entretien : un rendez-vous est proposé, confirmé puis évalué par un responsable autorisé.

## SA-4 — Architecture technique

- Frontend : React + TypeScript + Vite. Les pages consomment exclusivement l'API HTTP.
- Backend : FastAPI, Pydantic v2, SQLAlchemy 2 asynchrone.
- Persistance : PostgreSQL. Alembic versionne les évolutions du schéma.
- Authentification : JWT Bearer de courte durée, mots de passe hashés avec bcrypt.
- Session visiteur : jeton opaque aléatoire ; seul son SHA-256 est conservé en base.
- Documents : stockage local configurable dans `UPLOAD_DIR` en développement ; stockage objet recommandé en production.
- Assistant IA : couche de service indépendante (`app/services/assistant.py`). Version actuelle : moteur provisoire à règles qui répond uniquement à partir du catalogue en base, affiché comme « version provisoire » dans l'interface ; il sera remplacé par l'agent LangGraph + RAG sans changer l'API.

### Flux de communication
Le navigateur appelle `/api/v1`. FastAPI valide le JWT ou le jeton de session visiteur, applique les règles d'accès, appelle les services et accède à PostgreSQL via SQLAlchemy. Les migrations Alembic sont exécutées séparément au déploiement.

## SA-5 — Contrat API et règles d'accès

Toutes les routes sont préfixées par `/api/v1`.

| Domaine | Routes principales | Accès |
|---|---|---|
| Authentification | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | Public / utilisateur connecté |
| Comptes internes | `GET/POST /auth/users`, `PATCH /auth/users/{id}/role`, `PATCH /auth/users/{id}/status` | Administrateur |
| Sessions visiteurs | `POST /sessions/visitor`, `GET /sessions/visitor/me` | Public avec jeton visiteur |
| Conversations | `POST/GET /conversations`, `GET/PATCH /conversations/{id}`, `POST/GET /conversations/{id}/messages`, `GET /conversations/{id}/memory` | Propriétaire visiteur ou candidat |
| Rattachement | `POST /sessions/visitor/claim` | Candidat connecté + consentement |
| Catalogue | `GET /catalog/institutions`, `GET /catalog/programs`, `GET /catalog/programs/{id}`, `GET /catalog/fees` | Public en lecture |
| Administration catalogue | `POST/PATCH/DELETE /catalog/programs` | Administrateur, ou responsable académique limité à son établissement |

Règles transversales :
- Le client ne choisit jamais son rôle à l'inscription : le rôle `candidate` est attribué côté serveur.
- Les rôles internes ne peuvent être créés que par un administrateur via un processus contrôlé.
- Une ressource est toujours filtrée par son propriétaire ou par le périmètre d'autorisation.
- Le rattachement d'une session visiteur nécessite `consent=true`, une session valide et non révoquée, et une vérification du jeton.
- Les erreurs utilisent les statuts HTTP standards : 401 non authentifié, 403 non autorisé, 404 ressource absente ou non accessible, 409 conflit métier, 422 validation.

Détail des flux visiteur → candidat : voir [`SA-23-29-visiteurs-memoire-auth.md`](SA-23-29-visiteurs-memoire-auth.md).
