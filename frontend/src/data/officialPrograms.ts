import { Program } from '../types';

export const OFFICIAL_PROGRAMS: Program[] = [
  // --- IIT (Institut International de Technologie) ---
  {
    id: 'iit-ing-info',
    name: 'Cycle Ingénieur en Génie Informatique',
    shortName: 'Génie Informatique',
    code: 'IIT-ING-INFO',
    institution: 'IIT',
    level: 'Ingénieur',
    duration: '3 ans (après prépa ou bac+2/3)',
    description: "Formation d'excellence accréditée EUR-ACE formant des ingénieurs capables de concevoir des architectures logicielles complexes, des modèles d'intelligence artificielle et des systèmes sécurisés.",
    prerequisites: [
      'Cycle Préparatoire réussi (Math-Physique ou Techno)',
      'Ou Licence en Informatique, Mathématiques ou EEA avec mention',
      'Ou diplôme équivalent validé par la commission délibérative'
    ],
    careerOpportunities: [
      'Ingénieur Intelligence Artificielle & Data',
      'Architecte Cloud & DevSecOps',
      'Lead Developer Full-Stack',
      'Chef de Projet Numérique International'
    ],
    curriculumHighlights: [
      'Machine Learning & Deep Learning appliqué',
      'Architecture Microservices & Cloud Native',
      'Cybersécurité & Audit des Systèmes',
      'Semestre international et stage PFE en entreprise'
    ],
    tuitionPerYearTND: 7200,
    featured: true
  },
  {
    id: 'iit-prepa',
    name: 'Cycle Préparatoire Intégré aux Études d’Ingénieur',
    shortName: 'Prépa Intégrée',
    code: 'IIT-PREPA',
    institution: 'IIT',
    level: 'Licence',
    duration: '2 ans',
    description: 'Deux années intensives d’acquisition des fondamentaux scientifiques, mathématiques et algorithmiques garantissant un accès direct aux filières ingénieur de l’IIT.',
    prerequisites: [
      'Baccalauréat Scientifique (Mathématiques, Sciences Expérimentales ou Sciences Techniques)',
      'Étude de dossier et entretien de motivation'
    ],
    careerOpportunities: [
      'Accès direct aux 4 filières ingénieur de l’IIT (Informatique, Civil, Industriel, Mécatronique)'
    ],
    curriculumHighlights: [
      'Algèbre, Analyse et Probabilités appliquées',
      'Physique Générale, Électronique et Mécanique',
      'Algorithmique avancée et Langage C/Python',
      'Anglais intensif et préparation aux certifications'
    ],
    tuitionPerYearTND: 5800,
    featured: true
  },
  {
    id: 'iit-ing-civil',
    name: 'Cycle Ingénieur en Génie Civil',
    shortName: 'Génie Civil',
    code: 'IIT-ING-CIVIL',
    institution: 'IIT',
    level: 'Ingénieur',
    duration: '3 ans',
    description: 'Formation accréditée préparant les futurs chefs de projets BTP, concepteurs de structures durables et experts en modélisation BIM.',
    prerequisites: [
      'Cycle Préparatoire scientifique validé',
      'Ou Licence en Génie Civil avec dossier académique rigoureux'
    ],
    careerOpportunities: [
      'Ingénieur Calculateur Structures (Béton & Métal)',
      'Chef de Chantier Grands Projets d’Infrastructure',
      'Directeur de Travaux BTP',
      'Expert BIM & Éco-construction'
    ],
    curriculumHighlights: [
      'Résistance des Matériaux & Géotechnique',
      'Conception parasismique et Eurocodes',
      'Modélisation BIM & Revit Architecture',
      'Gestion financière et légale des chantiers'
    ],
    tuitionPerYearTND: 6800,
    featured: false
  },
  {
    id: 'iit-ing-indus',
    name: 'Cycle Ingénieur en Génie Industriel & Logistique',
    shortName: 'Génie Industriel',
    code: 'IIT-ING-INDUS',
    institution: 'IIT',
    level: 'Ingénieur',
    duration: '3 ans',
    description: 'Expertise multidisciplinaire à la croisée du management opérationnel, de l’industrie 4.0 et de la gestion de la Supply Chain globale.',
    prerequisites: [
      'Cycle Prépa ou Licence scientifique/technique'
    ],
    careerOpportunities: [
      'Directeur Supply Chain',
      'Consultant Lean Manufacturing & Qualité',
      'Ingénieur Méthodes & Industrialisation',
      'Responsable Logistique Internationale'
    ],
    curriculumHighlights: [
      'Optimisation des flux et Lean Six Sigma',
      'Supply Chain Management & ERP SAP',
      'Automatisation et Usine Intelligente 4.0',
      'Audit de Performance Industrielle'
    ],
    tuitionPerYearTND: 6700,
    featured: false
  },
  {
    id: 'iit-lic-info',
    name: 'Licence en Sciences de l’Informatique & Développement Web',
    shortName: 'Licence Informatique',
    code: 'IIT-LIC-INFO',
    institution: 'IIT',
    level: 'Licence',
    duration: '3 ans (Bac+3)',
    description: 'Cursus moderne axé sur les technologies web, le génie logiciel pratique et les bases de données relationnelles et NoSQL.',
    prerequisites: [
      'Baccalauréat Informatique, Mathématiques, Sciences ou Économie'
    ],
    careerOpportunities: [
      'Développeur Web & Mobile',
      'Administrateur Systèmes & Réseaux',
      'Poursuite en Cycle Ingénieur IIT'
    ],
    curriculumHighlights: [
      'Frontend moderne (React, TypeScript)',
      'Backend & API RESTful (Python/Node.js)',
      'Bases de données SQL et architectures web',
      'Méthodologies Agiles et Scrum'
    ],
    tuitionPerYearTND: 5400,
    featured: true
  },

  // --- ISB (International School of Business) ---
  {
    id: 'isb-lic-mgmt',
    name: 'Licence en Management & Stratégie d’Entreprise',
    shortName: 'Licence Management',
    code: 'ISB-LIC-MGMT',
    institution: 'ISB',
    level: 'Licence',
    duration: '3 ans (Bac+3)',
    description: 'Programme international axé sur le leadership, la conduite du changement, la stratégie globale et l’entrepreneuriat.',
    prerequisites: [
      'Baccalauréat Économie & Gestion, Mathématiques, Sciences ou Lettres',
      'Bon niveau de français et d’anglais'
    ],
    careerOpportunities: [
      'Chef de Projet Junior',
      'Chargé de Développement Commercial',
      'Consultant Junior en Organisation',
      'Créateur d’Entreprise / Startup'
    ],
    curriculumHighlights: [
      'Management Stratégique & Leadership',
      'Gestion Financière & Contrôle de Gestion',
      'Marketing International & Négociation',
      'Projets de Création d’Entreprise encadrés'
    ],
    tuitionPerYearTND: 5200,
    featured: true
  },
  {
    id: 'isb-lic-fintech',
    name: 'Licence en Finance & Technologies Financières (FinTech)',
    shortName: 'Licence FinTech',
    code: 'ISB-LIC-FINTECH',
    institution: 'ISB',
    level: 'Licence',
    duration: '3 ans',
    description: 'Programme innovant combinant les disciplines financières rigoureuses avec la révolution numérique bancaire et les monnaies digitales.',
    prerequisites: [
      'Baccalauréat Économie & Gestion, Mathématiques ou Sciences'
    ],
    careerOpportunities: [
      'Analyste Financier',
      'Chargé d’Affaires Bancaires & FinTech',
      'Auditeur Financier Junior',
      'Gestionnaire de Portefeuille'
    ],
    curriculumHighlights: [
      'Mathématiques Financières & Modélisation',
      'Marchés des Capitaux & Gestion des Risques',
      'Blockchain, Cryptomonnaies & Paiements Numériques',
      'Analyse Financière des Sociétés Cotées'
    ],
    tuitionPerYearTND: 5300,
    featured: true
  },
  {
    id: 'isb-mast-analytics',
    name: 'Master Professionnel en Business Analytics & Big Data',
    shortName: 'Master Business Analytics',
    code: 'ISB-MAST-ANALYTICS',
    institution: 'ISB',
    level: 'Master',
    duration: '2 ans (Bac+5)',
    description: 'Formation de haut niveau pour décideurs basée sur la valorisation de la donnée, l’intelligence d’affaires et les modèles prédictifs pour le business.',
    prerequisites: [
      'Licence en Économie, Finance, Gestion, Informatique de Gestion ou Mathématiques',
      'Entretien de sélection et test de compétences'
    ],
    careerOpportunities: [
      'Business Intelligence Consultant',
      'Data Analyst Marketing & Finance',
      'Chief Data Officer d’Entreprise',
      'Directeur de la Stratégie basée sur la Donnée'
    ],
    curriculumHighlights: [
      'Data Visualization (PowerBI, Tableau)',
      'Data Mining & Modélisation Prédictive sous Python/R',
      'Stratégie de Gouvernance des Données d’Entreprise',
      'Stage professionnel de 6 mois et mémoire de fin d’études'
    ],
    tuitionPerYearTND: 6400,
    featured: true
  },
  {
    id: 'isb-mast-finance',
    name: 'Master Professionnel en Finance Internationale & Ingénierie Financière',
    shortName: 'Master Finance Internationale',
    code: 'ISB-MAST-FINANCE',
    institution: 'ISB',
    level: 'Master',
    duration: '2 ans',
    description: 'Préparation approfondie aux métiers de la banque d’investissement, de la finance d’entreprise multinationale et de la gestion de fonds.',
    prerequisites: [
      'Licence en Finance, Économie ou Sciences de Gestion'
    ],
    careerOpportunities: [
      'Gestionnaire de Fonds d’Investissement',
      'Analyste M&A (Fusions & Acquisitions)',
      'Directeur Administratif et Financier (DAF)',
      'Auditeur Senior en Cabinet International'
    ],
    curriculumHighlights: [
      'Évaluation d’Entreprise & Fusions-Acquisitions',
      'Produits Dérivés & Couverture des Risques de Change',
      'Private Equity & Financement Structuré',
      'Normes Comptables Internationales IFRS'
    ],
    tuitionPerYearTND: 6200,
    featured: false
  }
];

