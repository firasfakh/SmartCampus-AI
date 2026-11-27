# Rapport de corrections — SA-1 à SA-29

Branche : `khouloud` · Date : 26/11/2026

**Vérification effectuée** : migrations appliquées sur une base PostgreSQL 16 vide,
`alembic check` sans écart, **37 tests automatisés réussis** (dont 14 tests d'intégration sur PostgreSQL réel),
build TypeScript du frontend sans erreur, parcours complet testé dans un navigateur
(visiteur → assistant → inscription → rattachement → espace admin).

## 🔴 Bloquants corrigés

| # | Problème constaté | Conséquence | Correction |
|---|---|---|---|
| 1 | Migration `sa25_visitor_001` recréant `visitor_sessions`, `conversations`, `messages`, déjà créées par la migration d'Emna | `alembic upgrade head` échouait (« relation already exists ») | Migration supprimée |
| 2 | Modèles SA-14 différents de la migration (`candidate_documents.requirement_set_id` absente en base, clés composites manquantes) | Toute requête sur les documents aurait planté | Nouvelle migration `sa14_align_001` (testée en upgrade et en downgrade) |
| 3 | `greenlet` non installé avec Python 3.13 (version conseillée dans Configuration.md) | Toutes les routes de l'API renvoyaient une erreur 500 | `sqlalchemy[asyncio]` + `greenlet` ajoutés à `requirements.txt` |
| 4 | Aucune donnée en base (SA-18 non réalisée) | Catalogue vide, assistant inutilisable | `scripts/seed_demo.py` + `scripts/data/demo_catalog.json` |
| 5 | Bouton de rattachement SA-29 jamais affiché dans l'interface | Fonctionnalité inaccessible | Fenêtre de consentement après connexion / inscription |
| 6 | Après l'inscription, redirection vers la page Connexion (état d'authentification périmé) | Le candidat devait se reconnecter | Contrôle d'accès effectué au moment de l'affichage |

## Détail par tâche

### SA-1 → SA-9 · Architecture et initialisation
- **SA-3/4/5** : documents mis à jour (nouvelles routes, assistant provisoire, périmètre par établissement).
- **SA-5** : contrôle d'accès par rôle ajouté dans l'interface (avant, un candidat pouvait ouvrir la console admin, sans données grâce au backend).
- **SA-7** : format d'erreur uniforme (`{success:false, error:{code,message}}` + `detail`) ; `CORS_ORIGINS` lisible depuis `.env` (liste séparée par des virgules) ; refus de démarrer en production avec la clé secrète par défaut ; `backend/.env.example` corrigé (il contenait une vraie `SECRET_KEY` et `POSTGRES_HOST=db`, incompatible avec un lancement via le venv).
- **SA-8** : `frontend/.env.example` contenait un `\n` littéral ; client HTTP qui gère l'expiration du JWT (retour au mode visiteur).
- **SA-9** : `docker-compose.backend.yml` dépendait d'un réseau Docker externe `backend_default` (échec sur une nouvelle machine). Il est remplacé par un seul `docker-compose.yml` (profil `full` pour le backend) ; la base de test est créée automatiquement ; le Dockerfile applique les migrations au démarrage.

### SA-10 → SA-22 · Données, catalogue et tests
- **SA-12** : le test historique `test_sa12_functional.py` faisait échouer toute la suite (saisie de mot de passe interactive et liste de tables obsolète). Il passe en exécution manuelle (`RUN_SA12_MANUAL=1`) avec des assertions corrigées.
- **SA-13/14** : migration d'alignement (bloquant n°2) et avertissements SQLAlchemy `overlaps` supprimés.
- **SA-16/17** : PostgreSQL 16 + pgvector via Docker, port 5433, base de test `smartcampus_test`.
- **SA-18** : seed idempotent : 2 établissements, 9 formations, frais, conditions, débouchés et 6 comptes de démo (un par rôle).
- **SA-20** : un responsable académique ne modifie que les formations de **son** établissement ; `PATCH` renvoyait `institution_code: null` ; suppression d'une formation référencée → 409 propre ; nouvelle route `GET /catalog/institutions`.
- **SA-21** : filtre des frais publiés fait en SQL (il était fait en Python après chargement) ; filtre par établissement ; le détail d'une formation inclut frais publiés et débouchés ; la liste inclut les frais de scolarité.
- **Frontend Programmes** : lit l'API (avant, uniquement un fichier statique), avec repli « hors ligne » si le backend est arrêté.
- **SA-22** : les anciens tests vérifiaient seulement l'existence des routes. Il y a maintenant 37 tests, dont 14 tests d'intégration sur PostgreSQL réel ; garde-fou pour ne jamais viser la base de dev.

### SA-23 → SA-29 · Visiteurs, mémoire, authentification
- **SA-25** : une session déjà rattachée restait utilisable : elle est maintenant **révoquée** au rattachement. La limite de messages était calculée par conversation (contournable en ouvrant de nouvelles conversations) : elle est désormais **par session**, avec un maximum de conversations. `GET /sessions/visitor/me` renvoie la consommation.
- **SA-26** : l'interface affichait une « mémoire » **codée en dur** (« Baccalauréat 2026 », « affinité 94 % ») et un faux enregistrement vocal. Ils sont remplacés par la vraie mémoire (`GET /conversations/{id}/memory` : 20 derniers messages + centres d'intérêt, niveau et section déduits). L'API stockait les messages sans jamais répondre : un **assistant provisoire** répond désormais à partir du catalogue en base et utilise la mémoire. Un verrou empêche les doublons de `sequence_no`, la purge des sessions expirées est périodique (au démarrage uniquement avant), et l'archivage des conversations est possible.
- **SA-28** : politique de mot de passe (lettre + chiffre, 72 octets max. pour bcrypt). Les responsables IIT et ISB n'étaient jamais distingués (le frontend envoyait tous les responsables vers l'espace IIT) : rattachement à un établissement via `responsible_assignments`, renvoyé par `/auth/me`. Côté admin : liste, création, changement de rôle et désactivation, et un compte désactivé perd l'accès immédiatement. L'onglet admin affichait des **personnes fictives** avec des adresses `.tn` d'apparence réelle : il est remplacé par la vraie gestion des comptes.
- **SA-29** : fenêtre de consentement (case à cocher obligatoire), transfert atomique (`FOR UPDATE`), révocation de l'ancien jeton. Le double chargement en développement (React StrictMode) créait une conversation vide en double : corrigé.

## ⚠️ À valider avec l'équipe
1. **Données de démonstration** : frais (ex. 7 200 TND/an pour le cycle ingénieur informatique), conditions et débouchés proviennent de `frontend/src/data/officialPrograms.ts`. Ils sont à confirmer auprès de l'administration avant la soutenance ; chaque frais porte une note « donnée de démonstration ».
2. **Assistant** : moteur provisoire à règles, présenté comme tel dans l'interface. L'agent LangGraph + RAG (sprints IA) le remplace en modifiant une seule fonction (`generate_reply`).
3. **Hors périmètre SA-29** : préinscription, documents, QCM, rendez-vous et tableaux de bord direction / entretiens utilisent encore des données simulées côté frontend. Exemple : le tableau de bord candidat appelle `GET /pre-registrations/current`, qui n'existe pas encore (404, puis repli local).
4. **Python** : l'équipe vise 3.13, ce poste utilise 3.12 ; les deux sont pris en charge.

## Fichiers principaux modifiés
Backend : `app/core/{config,security,exceptions}.py`, `app/main.py`, `app/database/connection.py`,
`app/api/v1/endpoints/{auth,sessions,conversations,catalog}.py`, `app/services/{visitor_sessions,memory,assistant}.py`,
`app/models/{candidate_documents,interviews}.py`, `alembic/versions/sa14_align_001_document_constraints.py`,
`scripts/{seed_demo.py,data/demo_catalog.json}`, `tests/*`, `requirements.txt`, `.env.example`, `Dockerfile`.
Frontend : `services/{api,authService,chatService,catalogService}.ts`, `context/AuthContext.tsx`, `App.tsx`,
`pages/candidate/ChatAssistantPage.tsx`, `pages/auth/{Login,Register}Page.tsx`, `pages/public/ProgramsPage.tsx`,
`pages/admin/AdminDashboard.tsx`, `components/common/ClaimHistoryModal.tsx`, `components/admin/UserManagementPanel.tsx`.
Racine : `docker-compose.yml`, `docker/postgres-init/`, `.env.example`, `README.md`, `docs/`.
