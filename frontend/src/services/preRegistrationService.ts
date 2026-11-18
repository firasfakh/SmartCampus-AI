import { api } from './api';
import { PreRegistrationDossier, CandidateDocument } from '../types';

export const DEFAULT_DOSSIER: PreRegistrationDossier = {
  id: 'dossier-2026-089',
  candidateId: 'cand-yassine-1',
  candidateName: 'Yassine Trabelsi',
  candidateEmail: 'yassine.trabelsi@gmail.com',
  institution: 'IIT',
  programId: 'iit-ing-info',
  programName: 'Cycle Ingénieur en Génie Informatique',
  status: 'submitted',
  submittedAt: '2026-11-08T14:30:00Z',
  reviewedAt: '2026-11-09T09:15:00Z',
  reviewerNotes: 'Dossier académique solide (Bac Mathématiques 15.42). QCM technique validé à 85%. Prêt pour l’entretien.',
  personalInfoCompleted: true,
  academicInfoCompleted: true,
  documentsUploadedCount: 4,
  documentsRequiredCount: 4,
};

export const DEFAULT_DOCUMENTS: CandidateDocument[] = [
  {
    id: 'doc-cin-1',
    candidateId: 'cand-yassine-1',
    documentType: 'cin',
    name: "Carte d'Identité Nationale (CIN)",
    fileName: 'CIN_Yassine_Trabelsi.pdf',
    fileSize: 1420000,
    uploadedAt: '2026-11-05',
    status: 'verified',
  },
  {
    id: 'doc-bac-rel',
    candidateId: 'cand-yassine-1',
    documentType: 'bac_transcript',
    name: 'Relevé de Notes du Baccalauréat',
    fileName: 'Releve_Notes_Bac_Math.pdf',
    fileSize: 2150000,
    uploadedAt: '2026-11-05',
    status: 'verified',
  },
  {
    id: 'doc-bac-dip',
    candidateId: 'cand-yassine-1',
    documentType: 'bac_diploma',
    name: 'Diplôme du Baccalauréat',
    fileName: 'Diplome_Bac_2026.pdf',
    fileSize: 3100000,
    uploadedAt: '2026-11-06',
    status: 'verified',
  },
  {
    id: 'doc-cv',
    candidateId: 'cand-yassine-1',
    documentType: 'cv',
    name: 'Curriculum Vitae (CV)',
    fileName: 'CV_Yassine_Trabelsi_2026.pdf',
    fileSize: 850000,
    uploadedAt: '2026-11-07',
    status: 'verified',
  }
];

export const preRegistrationService = {
  async getDossier(): Promise<PreRegistrationDossier> {
    try {
      const res = await api.get<any>('/pre-registrations/current');
      if (res && res.id) return res;
    } catch {
      // Backend mock placeholder
    }

    const saved = localStorage.getItem('smartcampus_dossier');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }

    localStorage.setItem('smartcampus_dossier', JSON.stringify(DEFAULT_DOSSIER));
    return DEFAULT_DOSSIER;
  },

  async updateDossier(updates: Partial<PreRegistrationDossier>): Promise<PreRegistrationDossier> {
    try {
      await api.put(`/pre-registrations/${updates.id || DEFAULT_DOSSIER.id}`, updates);
    } catch {
      // Backend mock placeholder
    }

    const current = await this.getDossier();
    const updated = { ...current, ...updates };
    localStorage.setItem('smartcampus_dossier', JSON.stringify(updated));
    return updated;
  },

  async submitDossier(): Promise<PreRegistrationDossier> {
    try {
      await api.post(`/pre-registrations/${DEFAULT_DOSSIER.id}/submit`);
    } catch {
      // Backend mock placeholder
    }

    return this.updateDossier({
      status: 'submitted',
      submittedAt: new Date().toISOString()
    });
  },

  async listAllDossiers(): Promise<PreRegistrationDossier[]> {
    return [
      DEFAULT_DOSSIER,
      {
        id: 'dossier-2026-090',
        candidateId: 'cand-sarra-2',
        candidateName: 'Sarra Khemakhem',
        candidateEmail: 'sarra.kh@yahoo.com',
        institution: 'ISB',
        programId: 'isb-lic-fintech',
        programName: 'Licence en Finance & FinTech',
        status: 'under_review',
        submittedAt: '2026-11-09T11:20:00Z',
        personalInfoCompleted: true,
        academicInfoCompleted: true,
        documentsUploadedCount: 4,
        documentsRequiredCount: 4,
      },
      {
        id: 'dossier-2026-091',
        candidateId: 'cand-mohamed-3',
        candidateName: 'Mohamed Bouaziz',
        candidateEmail: 'm.bouaziz@gmail.com',
        institution: 'IIT',
        programId: 'iit-ing-info',
        programName: 'Cycle Ingénieur en Génie Informatique',
        status: 'accepted',
        submittedAt: '2026-11-02T16:00:00Z',
        reviewedAt: '2026-11-04T10:00:00Z',
        reviewerNotes: 'Admission définitive accordée suite à l’avis très favorable de la commission d’entretien.',
        personalInfoCompleted: true,
        academicInfoCompleted: true,
        documentsUploadedCount: 4,
        documentsRequiredCount: 4,
      }
    ];
  },

  async getDocuments(): Promise<CandidateDocument[]> {
    const saved = localStorage.getItem('smartcampus_docs');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    localStorage.setItem('smartcampus_docs', JSON.stringify(DEFAULT_DOCUMENTS));
    return DEFAULT_DOCUMENTS;
  },

  async uploadDocument(type: CandidateDocument['documentType'], file: File): Promise<CandidateDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', type);

    try {
      await api.post('/documents/', formData);
    } catch {
      // Backend mock placeholder
    }

    const newDoc: CandidateDocument = {
      id: `doc-${Date.now()}`,
      candidateId: 'cand-yassine-1',
      documentType: type,
      name: file.name,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'pending',
    };

    const currentDocs = await this.getDocuments();
    const updated = [...currentDocs.filter(d => d.documentType !== type), newDoc];
    localStorage.setItem('smartcampus_docs', JSON.stringify(updated));
    return newDoc;
  }
};

