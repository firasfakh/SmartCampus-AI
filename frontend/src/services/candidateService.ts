import { api } from './api';
import { CandidateProfile, OrientationRecommendation } from '../types';
import { OFFICIAL_PROGRAMS } from '../data/officialPrograms';

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  id: 'cand-yassine-1',
  userId: 'usr-candidate-1',
  firstName: 'Yassine',
  lastName: 'Trabelsi',
  email: 'yassine.trabelsi@gmail.com',
  phone: '+216 22 123 456',
  governorate: 'Sfax',
  currentLevel: 'Baccalauréat',
  bacSection: 'Mathématiques',
  bacYear: 2026,
  bacAverage: 15.42,
  interests: ['Intelligence Artificielle', 'Développement Web', 'Algorithmes', 'Robotique'],
  preferredSubjects: ['Mathématiques', 'Informatique', 'Physique'],
  careerGoals: 'Devenir ingénieur en intelligence artificielle ou data scientist dans une multinationale.',
  targetInstitution: 'IIT',
  targetProgramId: 'iit-ing-info',
  completenessPercentage: 85,
};

export const candidateService = {
  async getProfile(): Promise<CandidateProfile> {
    try {
      const res = await api.get<any>('/candidates/me');
      if (res && res.id) return res;
    } catch {
      // Backend mock placeholder
    }

    const saved = localStorage.getItem('smartcampus_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }

    localStorage.setItem('smartcampus_profile', JSON.stringify(DEFAULT_CANDIDATE_PROFILE));
    return DEFAULT_CANDIDATE_PROFILE;
  },

  async updateProfile(updates: Partial<CandidateProfile>): Promise<CandidateProfile> {
    try {
      await api.put('/candidates/me', updates);
    } catch {
      // Backend mock placeholder
    }

    const current = await this.getProfile();
    const updated = { ...current, ...updates };

    // Recalcul de complétude
    let filledCount = 0;
    const fieldsToCheck = [updated.firstName, updated.lastName, updated.phone, updated.bacSection, updated.bacAverage, updated.careerGoals];
    fieldsToCheck.forEach(f => { if (f) filledCount++; });
    if (updated.interests && updated.interests.length > 0) filledCount++;
    updated.completenessPercentage = Math.round((filledCount / 7) * 100);

    localStorage.setItem('smartcampus_profile', JSON.stringify(updated));
    return updated;
  },

  async getRecommendations(profile: CandidateProfile): Promise<OrientationRecommendation[]> {
    // Calcul intelligent des recommandations basé sur le profil académique
    const recommendations: OrientationRecommendation[] = [];

    // Priorité 1: Génie Informatique IIT
    const progInfo = OFFICIAL_PROGRAMS.find(p => p.id === 'iit-ing-info')!;
    recommendations.push({
      programId: progInfo.id,
      program: progInfo,
      compatibilityScore: 94,
      reasons: [
        "Excellente affinité avec votre Bac Mathématiques (Moyenne: 15.42/20).",
        "Correspondance directe avec vos intérêts pour l'Intelligence Artificielle et le code.",
        "Accréditation européenne EUR-ACE et réseau international d'échanges."
      ],
      prerequisitesMet: true,
      academicStrengths: ['Moyenne en Mathématiques', 'Score de logique élevé', 'Projet orienté tech'],
      careerMatch: 'Architecte IA, Lead Dev, Data Scientist',
      suggestedAction: 'Démarrer la préinscription et passer le QCM technique personnalisé.'
    });

    // Priorité 2: Business Analytics & Big Data ISB
    const progAnalytics = OFFICIAL_PROGRAMS.find(p => p.id === 'isb-mast-analytics')!;
    recommendations.push({
      programId: progAnalytics.id,
      program: progAnalytics,
      compatibilityScore: 82,
      reasons: [
        "Option hybride combinant analyse quantitative et stratégie managériale.",
        "Fort débouché dans le conseil stratégique et la Fintech.",
        "Partenariats solides avec les entreprises du secteur financier."
      ],
      prerequisitesMet: true,
      academicStrengths: ['Esprit d’analyse', 'Compétences numériques'],
      careerMatch: 'Business Intelligence Consultant, Chief Data Officer',
      suggestedAction: 'Découvrir la plaquette des cours et échanger avec le responsable ISB.'
    });

    // Priorité 3: Prépa Intégrée IIT
    const progPrepa = OFFICIAL_PROGRAMS.find(p => p.id === 'iit-prepa')!;
    recommendations.push({
      programId: progPrepa.id,
      program: progPrepa,
      compatibilityScore: 78,
      reasons: [
        "Passerelle directe vers les 4 spécialités ingénieur de l'IIT sans passer le concours national.",
        "Encadrement personnalisé en petits groupes de travaux dirigés."
      ],
      prerequisitesMet: true,
      academicStrengths: ['Bases scientifiques solides'],
      careerMatch: 'Ingénieur Polyvalent',
      suggestedAction: 'Consulter les modalités d’admission immédiate.'
    });

    return recommendations;
  },

  async listCandidatesForResponsible(): Promise<CandidateProfile[]> {
    try {
      const res = await api.get<any>('/candidates/');
      if (Array.isArray(res)) return res;
    } catch {
      // Backend mock placeholder
    }

    // Données de démonstration réalistes pour les responsables académiques
    return [
      DEFAULT_CANDIDATE_PROFILE,
      {
        id: 'cand-sarra-2',
        userId: 'usr-cand-2',
        firstName: 'Sarra',
        lastName: 'Khemakhem',
        email: 'sarra.kh@yahoo.com',
        phone: '+216 29 876 543',
        governorate: 'Sfax',
        currentLevel: 'Baccalauréat',
        bacSection: 'Économie et Gestion',
        bacYear: 2026,
        bacAverage: 16.10,
        interests: ['Finance', 'Fintech', 'Investissement', 'Audit'],
        preferredSubjects: ['Économie', 'Gestion', 'Mathématiques'],
        careerGoals: 'Travailler dans une banque d’affaires internationale ou un cabinet d’audit Big 4.',
        targetInstitution: 'ISB',
        targetProgramId: 'isb-lic-fintech',
        completenessPercentage: 95,
      },
      {
        id: 'cand-mohamed-3',
        userId: 'usr-cand-3',
        firstName: 'Mohamed',
        lastName: 'Bouaziz',
        email: 'm.bouaziz@gmail.com',
        phone: '+216 55 432 109',
        governorate: 'Tunis',
        currentLevel: 'Licence Informatique (L3)',
        higherEducationLevel: 'Bac+3',
        higherEducationInstitution: 'ISIMS Sfax',
        interests: ['DevOps', 'Cloud', 'Réseaux', 'Sécurité'],
        preferredSubjects: ['Systèmes distribués', 'Bases de données'],
        careerGoals: 'Intégrer le cycle ingénieur IIT en admission parallèle.',
        targetInstitution: 'IIT',
        targetProgramId: 'iit-ing-info',
        completenessPercentage: 90,
      }
    ];
  }
};

