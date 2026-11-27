# SA-23 → SA-29 — Visiteurs sans compte, mémoire conversationnelle, authentification et rattachement

## Vue d'ensemble du flux

```
Visiteur (navigateur)                         API FastAPI                         PostgreSQL
 │ 1. POST /sessions/visitor ───────────────▶ jeton aléatoire (48 octets) ──────▶ visitor_sessions.token_hash (SHA-256)
 │ ◀─────────────── session_token (renvoyé UNE fois, stocké dans localStorage)
 │ 2. POST /conversations  (X-Visitor-Token) ▶ conversation du visiteur ─────────▶ conversations.visitor_session_id
 │ 3. POST /conversations/{id}/messages ────▶ mémoire (20 derniers msgs) + assistant ▶ messages (user + assistant)
 │ 4. POST /auth/register ou /auth/login ───▶ compte candidate + JWT
 │ 5. Fenêtre « Conserver votre historique ? » + case de consentement
 │ 6. POST /sessions/visitor/claim {consent:true}  (Bearer + X-Visitor-Token)
 │                                           ▶ verrou FOR UPDATE, conversations.user_id = candidat,
 │                                             session is_claimed + revoked_at
 ▼ 7. Le candidat retrouve son historique ; l'ancien jeton visiteur ne donne plus accès à rien.
```

## SA-25 — Sessions visiteurs
| Règle | Implémentation |
|---|---|
| Jeton imprévisible | `secrets.token_urlsafe(48)` |
| Jamais stocké en clair | seul `sha256(jeton)` est en base (`uq_visitor_sessions_token_hash`) |
| Expiration | `VISITOR_SESSION_TTL_HOURS` (24 h par défaut) |
| Jeton invalide/expiré/révoqué | ignoré (le visiteur en recrée un) ; 401 sur `/sessions/visitor/me` |
| Anti-abus | `VISITOR_MAX_CONVERSATIONS` (5) et `VISITOR_MAX_MESSAGES` (60) par session → 429 |
| Isolation | une conversation d'un autre propriétaire renvoie 404 |

## SA-26 — Mémoire temporaire des conversations
- **Mémoire persistée** : tables `conversations` / `messages` (numérotation `sequence_no` protégée
  par un verrou sur la conversation : pas de doublon en cas d'envois simultanés).
- **Mémoire de travail** : `GET /conversations/{id}/memory` renvoie les `MEMORY_WINDOW_MESSAGES`
  derniers messages + des indices de profil (centres d'intérêt, niveau, section) extraits des
  messages du candidat (`app/services/memory.py`).
- **Caractère temporaire** : les conversations d'une session visiteur expirée et non rattachée sont
  supprimées au démarrage de l'API puis toutes les `VISITOR_CLEANUP_INTERVAL_MINUTES` (60 min).

### Assistant provisoire (`app/services/assistant.py`)
En attendant l'agent LangGraph + RAG, un moteur à règles répond **uniquement** à partir du catalogue
en base (formations, frais publiés, conditions d'admission, débouchés). Il exploite la mémoire :
après « j'aime l'informatique », la question « combien ça coûte ? » vise les formations
d'informatique. Il détecte le tunisien / l'Arabizi mais répond en français (signalé à l'utilisateur).

**Brancher l'agent IA** : remplacer `generate_reply(db, memory, user_text)` par l'appel à l'agent en
lui passant `memory` (déjà au format JSON). Le reste (endpoint, stockage, frontend) ne change pas.

## SA-28 — Authentification et rôles
- `POST /auth/register` crée **toujours** un compte `candidate` (le champ `role` éventuel est ignoré).
- Mots de passe : bcrypt ; 8 caractères min. avec lettre + chiffre (12 pour les comptes internes).
- JWT HS256 (`ACCESS_TOKEN_EXPIRE_MINUTES`, 60 min) ; **le rôle est relu en base à chaque requête** :
  un compte désactivé perd l'accès immédiatement.
- Administration (`admin` uniquement) : `GET/POST /auth/users`, `PATCH /auth/users/{id}/role`,
  `PATCH /auth/users/{id}/status`.
- Un responsable (académique ou entretiens) est rattaché à **un** établissement via
  `responsible_assignments` ; un responsable académique ne modifie que le catalogue de son
  établissement (403 sinon). `/auth/me` renvoie `institution_code`, utilisé par le frontend pour
  ouvrir l'espace IIT ou ISB.

## SA-29 — Rattachement
- Exige : JWT d'un **candidat** + jeton visiteur valide + `consent: true` (400 sinon).
- Atomique et protégé contre la concurrence (`SELECT … FOR UPDATE`).
- Après rattachement, la session visiteur est **révoquée** : l'ancien jeton ne permet plus de lire
  les conversations, devenues celles du candidat.
- Refus du candidat : le jeton est oublié côté navigateur ; l'historique anonyme est purgé à expiration.

## Endpoints
| Méthode | Route | Accès |
|---|---|---|
| POST | `/sessions/visitor` | public |
| GET | `/sessions/visitor/me` | jeton visiteur |
| POST | `/sessions/visitor/claim` | candidat + jeton visiteur |
| GET/POST | `/conversations/` | visiteur ou candidat |
| GET/PATCH | `/conversations/{id}` | propriétaire |
| GET/POST | `/conversations/{id}/messages` | propriétaire |
| GET | `/conversations/{id}/memory` | propriétaire |
| POST | `/auth/register`, `/auth/login` | public |
| GET | `/auth/me` · POST `/auth/logout` | connecté |
| GET/POST | `/auth/users` · PATCH `/auth/users/{id}/role|status` | admin |

Les comptes internes (responsables, direction, admin) n'utilisent pas l'assistant candidat (403).

## Limites connues
- Pas de révocation immédiate d'un JWT avant expiration (sauf désactivation du compte).
- Pas de vérification d'e-mail ni de mot de passe oublié.
- Transcription vocale (Whisper) et compréhension complète du tunisien/Arabizi : avec l'agent IA.
