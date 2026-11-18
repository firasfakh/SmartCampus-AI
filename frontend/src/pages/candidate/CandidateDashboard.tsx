import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { candidateService } from '../../services/candidateService';
import { preRegistrationService } from '../../services/preRegistrationService';
import { appointmentService } from '../../services/appointmentService';
import { qcmService } from '../../services/qcmService';
import { CandidateProfile, PreRegistrationDossier, Appointment, QCMTest } from '../../types';
import { 
  User, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  GraduationCap, 
  ChevronRight,
  ClipboardCheck,
  ShieldAlert,
  Download
} from 'lucide-react';

interface CandidateDashboardProps {
  onNavigate: (page: string) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [dossier, setDossier] = useState<PreRegistrationDossier | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [qcm, setQcm] = useState<QCMTest | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const p = await candidateService.getProfile();
      setProfile(p);
      const d = await preRegistrationService.getDossier();
      setDossier(d);
      const a = await appointmentService.getMyAppointments();
      setAppointments(a);
      const q = await qcmService.getPersonalizedTest();
      setQcm(q);
    };
    loadData();
  }, []);

  const upcomingAppointment = appointments.find(a => a.status === 'confirmed' || a.status === 'scheduled');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-800 text-teal-300 text-xs font-semibold border border-navy-700">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Espace Candidat Intelligent</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Bienvenue, {user?.firstName} {user?.lastName} !
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Votre candidature pour le <strong>Cycle Ingénieur en Génie Informatique (IIT)</strong> progresse avec succès. Suivez vos étapes ci-dessous.
              </p>
            </div>

            {/* Profile Completeness Gauge */}
            <div className="bg-navy-800/80 p-4 rounded-xl border border-navy-700 backdrop-blur shrink-0 sm:w-64">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span>Complétude du profil</span>
                <span className="text-teal-400 font-bold">{profile?.completenessPercentage || 85}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-400 to-sky-400 transition-all duration-500"
                  style={{ width: `${profile?.completenessPercentage || 85}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Bac Mathématiques &bull; Relevés vérifiés
              </p>
            </div>
          </div>
        </div>

        {/* 4 Pillars Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Dossier de Préinscription */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {dossier?.status === 'submitted' ? 'Déposé' : 'En cours'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">Dossier de Préinscription</h3>
              <p className="text-xs text-slate-500">
                {dossier?.documentsUploadedCount}/{dossier?.documentsRequiredCount} pièces officielles déposées et vérifiées.
              </p>
            </div>
            <button
              onClick={() => onNavigate('pre-registration')}
              className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center justify-between"
            >
              <span>Consulter mon dossier</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: QCM Personnalisé */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Validé : {qcm?.score || 85}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">Test QCM Personnalisé</h3>
              <p className="text-xs text-slate-500">
                Évaluation technique et logique validée avec mention très favorable.
              </p>
            </div>
            <button
              onClick={() => onNavigate('qcm')}
              className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center justify-between"
            >
              <span>Voir les résultats détaillés</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Entretien & Rendez-vous */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  {upcomingAppointment ? '15 Nov 2026' : 'À planifier'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">Entretien d'Admission</h3>
              <p className="text-xs text-slate-500">
                {upcomingAppointment ? 'Confirmé en présentiel au Campus IIT Sfax.' : 'Aucun rendez-vous fixé.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center justify-between"
            >
              <span>Gérer mes rendez-vous</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 4: Assistant IA & Orientation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-navy-900 text-teal-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  Affinité : 94%
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-900 mb-1">Orientation & Recommandation</h3>
              <p className="text-xs text-slate-500">
                Poursuivez vos échanges avec l'assistant virtuel en français ou en derja.
              </p>
            </div>
            <button
              onClick={() => onNavigate('chat')}
              className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-navy-900 hover:text-sky-600 flex items-center justify-between"
            >
              <span>Ouvrir l'Assistant IA</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Detailed Panels: Next Recommended Action & Application Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Next Action & Interview Prep */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-navy-900">Prochaine Étape Recommandée</h3>
                <p className="text-xs text-slate-500">Accompagnement personnalisé pour maximiser vos chances d'admission</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Action Prioritaire
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-navy-900">Préparer votre Entretien Technique</h4>
                <p className="text-xs text-slate-600">
                  Votre entretien est fixé au <strong>15 Novembre 2026 à 10:00</strong> avec M. Mehdi Karray. Consultez la grille d'évaluation et les questions types.
                </p>
              </div>
              <button
                onClick={() => onNavigate('interview-prep')}
                className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shrink-0 transition"
              >
                Préparer mon Entretien
              </button>
            </div>

            {/* Quick Links Menu */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Accès Rapides Candidat
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onNavigate('profile')}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  <p className="text-xs font-bold text-navy-900">Mon Profil Académique</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Notes, Bac & Intérêts</p>
                </button>
                <button
                  onClick={() => onNavigate('recommendations')}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  <p className="text-xs font-bold text-navy-900">Mes Recommandations</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Scores d'affinité IA</p>
                </button>
                <button
                  onClick={() => onNavigate('pre-registration')}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  <p className="text-xs font-bold text-navy-900">Mes Documents</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">CIN, Relevés, CV</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Academic Status Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-3">
              Suivi d'Admission Officiel
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-900">Dépôt du Dossier</h4>
                  <p className="text-[11px] text-slate-500">Effectué le 08/11/2026 à 14:30</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-900">QCM Technique Validé</h4>
                  <p className="text-[11px] text-slate-500">Score de 85% — Recommandation confirmée</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-900">Entretien Pédagogique</h4>
                  <p className="text-[11px] text-slate-500">Programmé pour le 15/11/2026</p>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-50">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-600">Décision Définitive d'Admission</h4>
                  <p className="text-[11px] text-slate-400">Après délibération de la commission</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-800">
              <span className="font-bold">Contact Responsable Admission :</span><br />
              admission@iit.ens.tn &bull; +216 29 911 911
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

