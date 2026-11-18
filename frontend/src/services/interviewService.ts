import { api } from './api';
import { InterviewRecord } from '../types';

export const DEFAULT_INTERVIEWS: InterviewRecord[] = [
  {
    id: 'int-2026-001',
    candidateId: 'cand-yassine-1',
    candidateName: 'Yassine Trabelsi',
    candidateEmail: 'yassine.trabelsi@gmail.com',
    programName: 'Cycle Ingénieur en Génie Informatique',
    institution: 'IIT',
    appointmentId: 'apt-2026-001',
    scheduledDate: '2026-11-15',
    scheduledTime: '10:00 - 10:45',
    interviewerName: 'M. Mehdi Karray',
    status: 'scheduled',
    qcmScore: 85,
    qcmStrengths: [
      'Maîtrise de la POO et de l’algorithmique',
      'Bon niveau d’anglais technique'
    ],
    conversationSummary: 'Candidat bachelier Mathématiques avec mention Bien. Passionné par l’IA et le génie logiciel. A exploré les options Cloud et Cybersécurité avec l’assistant.',
    motivationScore: 4,
    academicPotentialScore: 5,
    communicationScore: 4,
    observations: 'Candidat dynamique, projet professionnel clair et motivé par la dimension internationale de l’IIT.',
    decision: 'pending',
  },
  {
    id: 'int-2026-002',
    candidateId: 'cand-sarra-2',
    candidateName: 'Sarra Khemakhem',
    candidateEmail: 'sarra.kh@yahoo.com',
    programName: 'Licence en Finance & FinTech',
    institution: 'ISB',
    appointmentId: 'apt-2026-002',
    scheduledDate: '2026-11-16',
    scheduledTime: '11:15 - 12:00',
    interviewerName: 'Dr. Nadia Chaker',
    status: 'scheduled',
    qcmScore: 90,
    qcmStrengths: [
      'Excellente culture économique et compréhension des marchés de capitaux'
    ],
    conversationSummary: 'Excellents résultats au Baccalauréat Économie (16.10). Intéressée par les technologies bancaires et la finance quantitative.',
    motivationScore: 5,
    academicPotentialScore: 5,
    communicationScore: 5,
    decision: 'pending',
  }
];

export const interviewService = {
  async getInterviews(): Promise<InterviewRecord[]> {
    try {
      const res = await api.get<any>('/interviews/');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Backend mock placeholder
    }

    const saved = localStorage.getItem('smartcampus_interviews');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    localStorage.setItem('smartcampus_interviews', JSON.stringify(DEFAULT_INTERVIEWS));
    return DEFAULT_INTERVIEWS;
  },

  async updateInterviewDecision(
    interviewId: string, 
    data: {
      decision: InterviewRecord['decision'];
      decisionRationale?: string;
      observations?: string;
      motivationScore?: number;
      academicPotentialScore?: number;
      communicationScore?: number;
    }
  ): Promise<InterviewRecord> {
    try {
      await api.patch(`/interviews/${interviewId}/result`, data);
    } catch {
      // Backend mock placeholder
    }

    const current = await this.getInterviews();
    const updated = current.map(item => {
      if (item.id === interviewId) {
        return {
          ...item,
          ...data,
          status: 'completed' as const,
        };
      }
      return item;
    });

    localStorage.setItem('smartcampus_interviews', JSON.stringify(updated));
    return updated.find(i => i.id === interviewId)!;
  }
};

