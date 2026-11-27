# SA-18, SA-20, SA-21 et SA-22 — Données de démo, API catalogue et tests

## SA-18 — Données de démonstration
`python -m scripts.seed_demo` (idempotent) charge depuis `scripts/data/demo_catalog.json` :
2 établissements, 9 formations, frais de scolarité 2026-2027 (statut `published`), conditions
d'admission, débouchés et 6 comptes de démonstration (un par rôle). Ces données proviennent de
`frontend/src/data/officialPrograms.ts` : **à faire valider par l'administration** avant toute
communication officielle (chaque frais porte une note en ce sens). Refusé si `ENVIRONMENT=production`.

## SA-20 — Gestion des formations
| Méthode | Route | Accès |
|---|---|---|
| GET | `/catalog/institutions` | public |
| GET | `/catalog/programs?institution=&program_type=&search=` | public |
| GET | `/catalog/programs/{id}` (conditions, frais publiés, débouchés) | public |
| POST / PATCH / DELETE | `/catalog/programs…` | admin, ou responsable académique **de l'établissement** |

La suppression d'une formation référencée est refusée (409).

## SA-21 — Tarifs et conditions d'admission
`GET /catalog/fees?program_id=&institution=` ne renvoie que les frais `published` (filtre SQL).
La devise vient de `fee_currency` (pas de TND supposé). Le modèle n'a pas de dates de validité :
une gestion temporelle nécessiterait une évolution de schéma.

## SA-22 — Tests
```cmd
cd backend
python -m pytest -q
```
37 tests : unitaires (sécurité, mémoire, détection d'intention) + intégration sur PostgreSQL réel
(`tests/test_integration_api.py`) : catalogue et filtres, périmètre IIT/ISB, inscription/connexion,
politique de mot de passe, rôles et désactivation, isolation des visiteurs, assistant + mémoire,
limites (429), archivage, purge des sessions expirées, rattachement et révocation du jeton.

Les tests d'intégration ciblent **uniquement** `smartcampus_test` (garde-fou dans `tests/conftest.py`)
et sont ignorés si cette base est absente. Frontend : `npm run build`.
