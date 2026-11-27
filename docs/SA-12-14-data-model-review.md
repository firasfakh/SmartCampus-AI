# Revue des tâches SA-12, SA-13 et SA-14

Cette revue décrit les entités déjà présentes dans le dépôt fourni et les contrôles à conserver.

## SA-12 — Catalogue académique
Le modèle `app/models/catalog.py` définit les établissements, formations, spécialisations, curricula, semestres, modules, matières, prérequis, frais et débouchés. Les identifiants du catalogue sont des clés `BIGINT IDENTITY`. Les codes des établissements et formations doivent rester uniques.

## SA-13 — Utilisateurs et candidatures
`UserAccount` stocke l'adresse e-mail normalisée, le hash du mot de passe, le rôle et l'état du compte. `CandidateProfile` est lié à un compte candidat ; `CandidateAcademicProfile` et `CandidateEducation` portent les informations académiques. `PreRegistration` conserve l'état du dossier et les métadonnées de décision.

## SA-14 — Documents et synchronisation
`CandidateDocument` et `RequiredDocumentType`/`DocumentRequirementSet` gèrent les pièces et les exigences. Les événements de traitement doivent être traçables ; le traitement vectoriel doit être idempotent et déclenché après validation d'un ajout, d'une modification ou d'une suppression.

### Points de vigilance
- Ne pas modifier directement les migrations déjà appliquées ; créer une nouvelle migration.
- Ne pas stocker de contenu de document ou de mot de passe en clair dans les journaux.
- Toute opération sur un document doit vérifier le propriétaire ou le rôle autorisé.
- Les suppressions doivent préserver la cohérence des dossiers et les références d'audit.

## Correction appliquée (novembre 2026) — migration `sa14_align_001`
`alembic check` signalait un écart entre les modèles et la migration `e0a55cf7d534` :
la colonne `candidate_documents.requirement_set_id` et plusieurs clés composites
(document ↔ dossier ↔ référentiel de pièces, entretien ↔ rendez-vous du même dossier) n'existaient
pas en base. Toute requête ORM sur `CandidateDocument` aurait échoué.
La migration `sa14_align_001` crée d'abord les contraintes UNIQUE, ajoute la colonne en la remplissant
depuis le dossier, puis remplace les clés étrangères. `alembic check` ne détecte plus aucun écart.

Une ancienne migration `sa25_visitor_001`, qui recréait `visitor_sessions`, `conversations` et
`messages` (déjà créées par `e0a55cf7d534`), a été supprimée : elle faisait échouer
`alembic upgrade head` (« relation already exists »).

Les relations `CandidateDocument.required_document_type` et `Interview.appointment` déclarent
désormais `overlaps="pre_registration"` (colonnes partagées par deux clés composites), ce qui
supprime les avertissements SQLAlchemy.
