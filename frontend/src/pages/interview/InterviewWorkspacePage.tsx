import React, { useState, useEffect } from 'react';
import { interviewService } from '../../services/interviewService';
import { InterviewRecord } from '../../types';
import { useToast } from '../../context/ToastContext';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  MessageSquare, 
  Award, 
  ShieldCheck,
  Save
} from 'lucide-react';

interface InterviewWorkspacePageProps {
  onNavigate: (page: string) => void;
}

export const InterviewWorkspacePage: React.FC<InterviewWorkspacePageProps> = ({ onNavigate }) => {
  const { success } = useToast();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRecord | null>(null);

  // Rubric Form States
  const [motivation, setMotivation] = useState<number>(4);
  const [academicPotential, setAcademicPotential] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(4);
  const [observations, setObservations] = useState<string>('');
  const [decision, setDecision] = useState<InterviewRecord['decision']>('admitted');

  useEffect(() => {
    const load = async () => {
      const list = await interviewService.getInterviews();
      setInterviews(list);
      if (list.length > 0) {
        setSelectedInterview(list[0]);
        setMotivation(list[0].motivationScore || 4);
        setAcademicPotential(list[0].academicPotentialScore || 5);
        setCommunication(list[0].communicationScore || 4);
        setObservations(list[0].observations || '');
        setDecision(list[0].decision || 'admitted');
      }
    };
    load();
  }, []);

  const handleSelect = (item: InterviewRecord) => {
    setSelectedInterview(item);
    setMotivation(item.motivationScore || 4);
    setAcademicPotential(item.academicPotentialScore || 5);
    setCommunication(item.communicationScore || 4);
    setObservations(item.observations || '');
    setDecision(item.decision || 'admitted');
  };

  const handleSaveDecision = async () => {
    if (!selectedInterview) return;
    const updated = await interviewService.updateInterviewDecision(selectedInterview.id, {
      decision,
      observations,
      motivationScore: motivation,
      academicPotentialScore: academicPotential,
      communicationScore: communication,
    });
    setSelectedInterview(updated);
    setInterviews(prev => prev.map(i => i.id === updated.id ? updated : i));
    success("Décision Enregistrée", `L'évaluation pour ${selectedInterview.candidateName} a été validée.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
              <Users className="w-4 h-4" />
              Espace Responsable des Entretiens & Admissions
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              Conduite des Entretiens & Évaluation des Candidats
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Évaluez les compétences, la motivation et enregistrez la délibération officielle d'admission.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800">
            {interviews.length} entretien{interviews.length > 1 ? 's' : ''} au planning
          </span>
        </div>

        {/* 2-Columns Layout: Schedule & Interview Evaluation Room */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Candidates Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 px-2">Candidats Programmés</h3>

            <div className="space-y-2">
              {interviews.map(item => {
                const isSelected = selectedInterview?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected 
                        ? 'bg-slate-100 border-navy-900 font-bold text-navy-950 shadow-xs' 
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{item.candidateName}</p>
                      <p className="text-[11px] text-slate-500">{item.institution} &bull; {item.scheduledDate} ({item.scheduledTime})</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.decision === 'admitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      QCM : {item.qcmScore}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Interview Assessment Room */}
          {selectedInterview && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    Fiche d'Entretien Officielle
                  </span>
                  <h2 className="text-xl font-bold text-navy-900 mt-1">
                    {selectedInterview.candidateName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Candidature : <strong>{selectedInterview.programName}</strong> ({selectedInterview.institution})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">{selectedInterview.scheduledDate}</span>
                  <span className="text-xs font-extrabold text-navy-900">{selectedInterview.scheduledTime}</span>
                </div>
              </div>

              {/* Summary extracted by AI */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-navy-900 uppercase flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  Synthèse de l'Assistant IA & Test QCM
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedInterview.conversationSummary}
                </p>
                <div className="pt-2 flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-600">Résultat QCM Technique :</span>
                  <span className="font-extrabold text-emerald-600">{selectedInterview.qcmScore}%</span>
                </div>
              </div>

              {/* Evaluation Rubric (Scores 1 to 5) */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase text-navy-900">Grille d'Évaluation de la Commission</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <label className="font-bold text-slate-800 block">Motivation & Projet (/5)</label>
                    <select
                      value={motivation}
                      onChange={e => setMotivation(parseInt(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-navy-900"
                    >
                      <option value={5}>5/5 — Exceptionnelle</option>
                      <option value={4}>4/5 — Très satisfaisante</option>
                      <option value={3}>3/5 — Moyenne</option>
                      <option value={2}>2/5 — Insuffisante</option>
                      <option value={1}>1/5 — Faible</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <label className="font-bold text-slate-800 block">Potentiel Académique (/5)</label>
                    <select
                      value={academicPotential}
                      onChange={e => setAcademicPotential(parseInt(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-navy-900"
                    >
                      <option value={5}>5/5 — Excellent</option>
                      <option value={4}>4/5 — Très bon</option>
                      <option value={3}>3/5 — Conforme</option>
                      <option value={2}>2/5 — Limite</option>
                      <option value={1}>1/5 — Non conforme</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <label className="font-bold text-slate-800 block">Communication & Anglais (/5)</label>
                    <select
                      value={communication}
                      onChange={e => setCommunication(parseInt(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-navy-900"
                    >
                      <option value={5}>5/5 — Très fluide</option>
                      <option value={4}>4/5 — Bonne maîtrise</option>
                      <option value={3}>3/5 — Moyen</option>
                      <option value={2}>2/5 — Hésitant</option>
                      <option value={1}>1/5 — Lacunaire</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observations Détaillées de la Commission</label>
                  <textarea
                    rows={3}
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                    placeholder="Notez ici les arguments de la décision (points saillants, engagement, niveau technique)..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Final Decision Registration */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Décision Finale :</span>
                  <select
                    value={decision}
                    onChange={e => setDecision(e.target.value as any)}
                    className="p-2 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="admitted">Admis Définitivement (Favorable)</option>
                    <option value="conditionally_admitted">Admis sous Réserve de Stage/Remise à niveau</option>
                    <option value="supplement_requested">Complément d'Information Requis</option>
                    <option value="refused">Non Admis</option>
                  </select>
                </div>

                <button
                  onClick={handleSaveDecision}
                  className="px-6 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer l'Avis Officiel</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

