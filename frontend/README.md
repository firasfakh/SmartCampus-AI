# 🎓 SmartCampus AI — Frontend Web (SA-8)

**Plateforme Intelligente & Agentique d’Orientation et d’Admission Universitaire**  
Développée pour l'**Institut International de Technologie (IIT)** et l'**International School of Business (ISB)** de Sfax.

Équipe **FYKEK — Groupe 3** &bull; Sujet Intelligence Artificielle Générative.

---

## 📋 Table des Matières

- [1. Présentation Générale](#1-présentation-générale)
- [2. Acteurs & Matrice des Rôles (SA-3 / SA-5)](#2-acteurs--matrice-des-rôles-sa-3--sa-5)
- [3. Fonctionnalités Implémentées](#3-fonctionnalités-implémentées)
- [4. Architecture Technique](#4-architecture-technique)
- [5. Intégration Backend FastAPI & RAG](#5-intégration-backend-fastapi--rag)
- [6. Installation & Démarrage](#6-installation--démarrage)
- [7. Commandes Utiles](#7-commandes-utiles)

---

## 1. Présentation Générale

SmartCampus AI est une plateforme web moderne conçue pour accompagner les futurs étudiants tout au long de leur parcours universitaire :
1. **Découverte des cursus** d'excellence de l'IIT (Ingénierie & Informatique) et de l'ISB (Business & Finance).
2. **Dialogue interactif avec un conseiller IA** bilingue (Français, Arabe Tunisien / Derja, Arabizi) avec support vocal (Whisper STT).
3. **Recommandations d'orientation personnalisées** avec scores d'affinité et explicabilité.
4. **Comparateur de programmes** permettant de juxtaposer jusqu'à 3 formations côte à côte.
5. **Dépôt du dossier de préinscription numérique** avec téléversement et vérification de documents (CIN, Relevés, Diplômes, CV).
6. **Passation de QCM technique et logique adaptatif** avec calcul de score et analyse des points forts.
7. **Prise de rendez-vous et préparation à l'entretien** d'admission (présentiel à Sfax ou visioconférence).
8. **Espaces administratifs dédiés** pour les jurys, responsables académiques, responsables d'entretiens et direction.

> **Principe Éthique Fondamental :** L'intelligence artificielle conseille, oriente et prépare les candidats, mais l'ensemble des décisions officielles d'admission et d'équivalence demeure sous la responsabilité exclusive des jurys et responsables académiques humains.

---

## 2. Acteurs & Matrice des Rôles (SA-3 / SA-5)

La plateforme intègre nativement un composant **RoleSwitcher** permettant de basculer instantanément entre les 7 profils pour tester l'ensemble des parcours :

| Rôle | Identifiant Démo | Accès & Fonctionnalités |
|---|---|---|
| **Visiteur** | `visiteur@smartcampus.tn` | Accueil public, consultation des catalogues IIT/ISB, découverte de l'assistant IA, inscription/connexion. |
| **Candidat** | `yassine.trabelsi@gmail.com` | Dashboard candidat, profil académique, dialogue IA avec mémoire, recommandations, préinscription, QCM, rendez-vous. |
| **Resp. Académique IIT** | `resp.iit@iit.tn` | Espace Ingénierie IIT : examen des candidats orientés vers le pôle technologique, confirmation ou réorientation des avis IA. |
| **Resp. Académique ISB** | `resp.isb@isb.tn` | Espace Business ISB : suivi des candidatures en Management, Finance et Business Analytics, ajustement des orientations. |
| **Resp. Entretiens** | `entretiens@smartcampus.tn` | Espace Admissions : planning des auditions, consultation des résultats QCM et résumés IA, grille d'évaluation (1-5) et délibération finale. |
| **Direction Générale** | `direction@iit-isb.tn` | Tableau de bord exécutif consolidé : entonnoir de conversion, comparaison IIT vs ISB, top des spécialités, export de rapports. |
| **Administrateur** | `admin@smartcampus.tn` | Console super-admin : gestion des documents RAG indexés, contrôle des rôles et supervision des micro-services. |

---

## 3. Fonctionnalités Implémentées

### 🌟 Expérience Publique & Découverte
- **Hero & Présentation Institutionnelle** : Mise en valeur des accréditations européennes (EUR-ACE) et des partenariats industriels.
- **Catalogue des Formations** : Moteur de recherche et filtres par pôle (IIT / ISB) et par niveau (Licence, Master, Ingénieur).
- **Comparateur Intelligent** : Juxtaposition modale de 2 à 3 filières (durée, prérequis, débouchés, frais annuels).

### 🤖 Assistant IA & Connaissances RAG
- **Dialogue Multilingue & Multimodal** : Français, dialecte tunisien (Derja) et Arabizi.
- **Intégration Vocale** : Enregistrement micro et transcription automatique (Whisper STT).
- **Citations de Sources RAG** : Chaque réponse certifiée référence les articles et guides officiels d'admission de l'IIT et de l'ISB.
- **Mémoire Dynamique du Profil** : Extraction progressive des aptitudes et mise à jour du score d'affinité.

### 📝 Admission & Candidature
- **Dossier de Préinscription** : Téléversement et suivi de pièces justificatives avec contrôle de taille et formats.
- **Test QCM Adaptatif** : Questionnaire technique et logique avec calcul de score instantané et axes d'amélioration.
- **Gestion des Rendez-vous** : Sélection de créneaux en présentiel (Campus Sfax) ou en ligne (Google Meet) avec confirmation et annulation.
- **Guide de Préparation à l'Entretien** : Questions fréquentes, grille de compétences et checklist des pièces à apporter.

### 🏛️ Espaces Administratifs
- **Espace Académique IIT & ISB** : Validation humaine des recommandations algorithmiques.
- **Espace Jurys d'Entretiens** : Fiche d'évaluation structurée (Motivation, Potentiel, Anglais) et enregistrement de l'admission définitive.
- **Tableau de Bord Direction** : Indicateurs stratégiques, entonnoir de conversion et ratios de transformation.
- **Console Administrateur RAG** : Gestion de l'index vectoriel des documents institutionnels.

---

## 4. Architecture Technique

```
frontend/
├── index.html                   # Point d'entrée HTML
├── package.json                 # Dépendances (React 19, Vite, Tailwind CSS, Lucide)
├── tailwind.config.js           # Thème institutionnel Navy & Teal
├── tsconfig.json                # Configuration TypeScript
├── vite.config.ts               # Configuration Vite
│
├── public/
│   └── logo.svg                 # Identité visuelle SmartCampus AI
│
└── src/
    ├── main.tsx                 # Point de montage React
    ├── App.tsx                  # Routeur principal & gardes d'accès par rôle
    ├── index.css                # Styles globaux & directives Tailwind
    │
    ├── types/                   # Définitions TypeScript complètes
    │   └── index.ts             # User, Program, Message, Dossier, QCM, Appointment, etc.
    │
    ├── data/
    │   └── officialPrograms.ts  # Données vérifiées des filières IIT & ISB
    │
    ├── services/                # Couche d'accès aux données & API
    │   ├── api.ts               # Client HTTP centralisé avec gestion des tokens
    │   ├── authService.ts       # Authentification & comptes de démo
    │   ├── candidateService.ts  # Profils & recommandations
    │   ├── chatService.ts       # Assistant conversationnel & RAG
    │   ├── preRegistrationService.ts # Dossiers & téléversements
    │   ├── qcmService.ts        # Moteur du QCM adaptatif
    │   ├── appointmentService.ts# Planification des entretiens
    │   ├── interviewService.ts  # Grilles d'évaluation de la commission
    │   └── directionService.ts  # Indicateurs décisionnels
    │
    ├── context/                 # État global React
    │   ├── AuthContext.tsx      # Gestion de session & rôles
    │   ├── ToastContext.tsx     # Notifications système
    │   └── LanguageContext.tsx  # Support multilingue & RTL
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx       # En-tête avec RoleSwitcher et sélecteur de langue
    │   │   └── Footer.tsx       # Pied de page institutionnel & accréditations
    │   └── common/
    │       └── RoleSwitcher.tsx # Sélecteur rapide des 7 profils autorisés
    │
    └── pages/
        ├── public/
        │   ├── HomePage.tsx     # Page d'accueil officielle
        │   └── ProgramsPage.tsx # Catalogue & comparateur de filières
        ├── candidate/
        │   ├── CandidateDashboard.tsx  # Tableau de bord futur étudiant
        │   ├── CandidateProfilePage.tsx# Gestion du profil et des notes
        │   ├── ChatAssistantPage.tsx   # Conseiller IA conversationnel & vocal
        │   ├── RecommendationsPage.tsx # Recommandations académiques
        │   ├── PreRegistrationPage.tsx # Dossier de préinscription
        │   ├── QCMPage.tsx             # Test d'évaluation technique
        │   ├── AppointmentsPage.tsx    # Gestion des rendez-vous
        │   └── InterviewPrepPage.tsx   # Préparation à l'entretien
        ├── academic/
        │   └── AcademicWorkspacePage.tsx # Espace Responsable IIT / ISB
        ├── interview/
        │   └── InterviewWorkspacePage.tsx# Espace Jury d'Admission
        ├── direction/
        │   └── DirectionDashboard.tsx    # Tableau de bord Direction Générale
        ├── admin/
        │   └── AdminDashboard.tsx        # Administration RAG & Système
        └── auth/
            ├── LoginPage.tsx    # Page de connexion
            └── RegisterPage.tsx # Page d'inscription
```

---

## 5. Intégration Backend FastAPI & RAG

Le frontend communique avec le backend FastAPI via la variable d'environnement `VITE_API_URL` (par défaut `http://localhost:8000/api/v1`).

- **Authentification** : Gestion des jetons Bearer JWT injectés dans les en-têtes HTTP de chaque requête.
- **Tolérance & Mode Résilient** : Lorsque le backend retourne un code placeholder ou est hors ligne, le client bascule automatiquement sur les données de démonstration avec notification transparente, garantissant une navigation ininterrompue.
- **RAG & Citations** : Les citations de documents retournées par les modèles sont inspectables en plein écran via des fenêtres modales dédiées.

---

## 6. Installation & Démarrage

### Prérequis
- **Node.js** v18 ou supérieur (v24.13.0 testé avec succès)
- **npm** v9 ou supérieur

### 1. Se positionner dans le dossier frontend
```bash
cd "d:\SmartCampus AI\frontend"
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer le serveur de développement
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

---

## 7. Commandes Utiles

| Commande | Action |
|---|---|
| `npm run dev` | Démarre le serveur de développement Vite avec Hot Reload |
| `npm run build` | Compile l'application TypeScript en bundle de production (`dist/`) |
| `npm run preview` | Prévisualise localement le bundle de production généré |

---

## 📝 Licence

Projet académique — Équipe FYKEK Groupe 3 &bull; IIT & ISB Sfax.
