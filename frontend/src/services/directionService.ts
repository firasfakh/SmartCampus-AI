import { DirectionMetrics } from '../types';

export const DEFAULT_DIRECTION_METRICS: DirectionMetrics = {
  totalConversations: 1428,
  totalCandidates: 894,
  totalPreRegistrations: 462,
  totalInterviewsCompleted: 218,
  finalAdmissionsCount: 165,
  iitCandidatesCount: 536,
  isbCandidatesCount: 358,
  iitPreRegistrationsCount: 284,
  isbPreRegistrationsCount: 178,
  conversionRate: 18.5, // Total conversations to final admission
  topPrograms: [
    { name: 'Cycle Ingénieur Génie Informatique', institution: 'IIT', candidateCount: 245 },
    { name: 'Master Business Analytics & Big Data', institution: 'ISB', candidateCount: 128 },
    { name: 'Cycle Préparatoire Intégré', institution: 'IIT', candidateCount: 114 },
    { name: 'Licence Finance & FinTech', institution: 'ISB', candidateCount: 96 },
    { name: 'Cycle Ingénieur Génie Civil', institution: 'IIT', candidateCount: 78 },
  ],
  funnelStages: [
    { name: 'Visiteurs & Conversations IA', count: 1428, percentage: 100 },
    { name: 'Profils Candidats Qualifiés', count: 894, percentage: 62.6 },
    { name: 'Recommandations Consultées', count: 710, percentage: 49.7 },
    { name: 'Dossiers Préinscriptions Déposés', count: 462, percentage: 32.3 },
    { name: 'QCM Personnalisés Complétés', count: 340, percentage: 23.8 },
    { name: 'Entretiens Passés', count: 218, percentage: 15.3 },
    { name: 'Admissions Définitives', count: 165, percentage: 11.6 }
  ],
  ragUsageCount: 4210,
  averageResponseTimeSeconds: 1.2,
};

export const directionService = {
  async getMetrics(): Promise<DirectionMetrics> {
    return DEFAULT_DIRECTION_METRICS;
  },

  async exportReportPdf(): Promise<void> {
    // Simulation du téléchargement de rapport analytique exécutif
    await new Promise(resolve => setTimeout(resolve, 800));
    window.print();
  }
};

