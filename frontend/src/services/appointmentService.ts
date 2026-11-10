import { api } from './api';
import { Appointment } from '../types';

export const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-2026-001',
    candidateId: 'cand-yassine-1',
    candidateName: 'Yassine Trabelsi',
    candidateEmail: 'yassine.trabelsi@gmail.com',
    candidatePhone: '+216 22 123 456',
    programName: 'Cycle Ingénieur en Génie Informatique',
    institution: 'IIT',
    date: '2026-11-15',
    timeSlot: '10:00 - 10:45',
    modality: 'in_person',
    locationOrLink: 'Campus IIT Sfax — Salle de Conférence B12',
    status: 'confirmed',
    notes: "Entretien d'admission technique et motivation avec la commission du département Informatique."
  },
  {
    id: 'apt-2026-002',
    candidateId: 'cand-sarra-2',
    candidateName: 'Sarra Khemakhem',
    candidateEmail: 'sarra.kh@yahoo.com',
    candidatePhone: '+216 29 876 543',
    programName: 'Licence en Finance & FinTech',
    institution: 'ISB',
    date: '2026-11-16',
    timeSlot: '11:15 - 12:00',
    modality: 'online_video',
    locationOrLink: 'https://meet.google.com/iit-isb-adm-2026',
    status: 'scheduled',
    notes: 'Entretien en visioconférence pour candidate résidant hors gouvernorat.'
  }
];

export const appointmentService = {
  async getMyAppointments(): Promise<Appointment[]> {
    try {
      const res = await api.get<any>('/appointments/');
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Backend mock placeholder
    }

    const saved = localStorage.getItem('smartcampus_apts');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    localStorage.setItem('smartcampus_apts', JSON.stringify(DEFAULT_APPOINTMENTS));
    return DEFAULT_APPOINTMENTS;
  },

  async scheduleAppointment(appointmentData: Partial<Appointment>): Promise<Appointment> {
    try {
      await api.post('/appointments/', appointmentData);
    } catch {
      // Backend mock placeholder
    }

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      candidateId: appointmentData.candidateId || 'cand-yassine-1',
      candidateName: appointmentData.candidateName || 'Yassine Trabelsi',
      candidateEmail: appointmentData.candidateEmail || 'yassine.trabelsi@gmail.com',
      candidatePhone: appointmentData.candidatePhone || '+216 22 123 456',
      programName: appointmentData.programName || 'Cycle Ingénieur en Génie Informatique',
      institution: appointmentData.institution || 'IIT',
      date: appointmentData.date || '2026-11-20',
      timeSlot: appointmentData.timeSlot || '14:00 - 14:45',
      modality: appointmentData.modality || 'in_person',
      locationOrLink: appointmentData.modality === 'online_video' 
        ? 'https://meet.google.com/iit-isb-adm-2026' 
        : 'Campus IIT Sfax — Salle de Réception',
      status: 'scheduled',
      notes: appointmentData.notes || 'Entretien planifié via SmartCampus AI.'
    };

    const current = await this.getMyAppointments();
    const updated = [newApt, ...current];
    localStorage.setItem('smartcampus_apts', JSON.stringify(updated));
    return newApt;
  },

  async cancelAppointment(id: string): Promise<void> {
    try {
      await api.delete(`/appointments/${id}`);
    } catch {
      // Backend mock placeholder
    }

    const current = await this.getMyAppointments();
    const updated = current.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a);
    localStorage.setItem('smartcampus_apts', JSON.stringify(updated));
  }
};

