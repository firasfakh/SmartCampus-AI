import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { candidateService } from '../../services/candidateService';
import { CandidateProfile, Institution } from '../../types';
import { useToast } from '../../context/ToastContext';
import { 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  Cpu, 
  TrendingUp, 
  ShieldCheck,
  Edit3
} from 'lucide-react';

interface AcademicWorkspacePageProps {
  onNavigate: (page: string) => void;
  targetInstitution?: Institution;
}

export const AcademicWorkspacePage: React.FC<AcademicWorkspacePageProps> = ({ onNavigate, targetInstitution }) => {
  const { user, role } = useAuth();
  const { success } = useToast();

  const institution: Institution = targetInstitution || (role === 'academic_isb' ? 'ISB' : 'IIT');
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [adjustedStatus, setAdjustedStatus] = useState<string>('confirmed');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const list = await candidateService.listCandidatesForResponsible();
      // Filtrer par institution selon le responsable
      const filtered = list.filter(c => !c.targetInstitution || c.targetInstitution === institution);
      setCandidates(filtered);
      if (filtered.length > 0) setSelectedCandidate(filtered[0]);
    };
    load();
  }, [institution]);

  const handleConfirmRecommendation = () => {
    success("Recommandation Validée", `L'orientation pour ${selectedCandidate?.firstName} ${selectedCandidate?.lastName} a été confirmée avec succès.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
              {institution === 'IIT' ? <Cpu className="w-4 h-4 text-sky-600" /> : <TrendingUp className="w-4 h-4 text-teal-600" />}
              <span>Espace Responsable Académique &bull; Pôle {institution}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              Validation des Orientations & Suivi Pédagogique
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Examen des profils qualifiés par l'IA et confirmation des orientations officielles pour l'<strong>{institution}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              institution === 'IIT' ? 'bg-sky-100 text-sky-800' : 'bg-teal-100 text-teal-800'
            }`}>
              {candidates.length} candidat{candidates.length > 1 ? 's' : ''} orienté{candidates.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* 2-Columns Layout: Candidate List & Detailed Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Candidates Column */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 px-2">Candidats {institution}</h3>
            
            <div className="space-y-2">
              {candidates.map(cand => {
                const isSelected = selectedCandidate?.id === cand.id;
                return (
                  <button
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected 
                        ? 'bg-slate-100 border-navy-900 font-bold text-navy-950 shadow-xs' 
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{cand.firstName} {cand.lastName}</p>
                      <p className="text-[11px] text-slate-500">Bac {cand.bacSection || 'Scientifique'} &bull; {cand.bacAverage || 15}/20</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      Affinité 94%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candidate Detailed Review */}
          {selectedCandidate && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                    Dossier Candidat Qualifié
                  </span>
                  <h2 className="text-xl font-bold text-navy-900 mt-1">
                    {selectedCandidate.firstName} {selectedCandidate.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedCandidate.email} &bull; {selectedCandidate.phone} &bull; {selectedCandidate.governorate}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">Bac {selectedCandidate.bacSection}</span>
                  <span className="text-base font-extrabold text-navy-900">Moyenne : {selectedCandidate.bacAverage}/20</span>
                </div>
              </div>

              {/* AI Recommendation Evaluation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-navy-900 flex items-center gap-1.5 uppercase">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    Orientation Recommandée par SmartCampus AI
                  </h4>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Score de compatibilité : 94%
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">
                  Filière visée : {institution === 'IIT' ? 'Cycle Ingénieur en Génie Informatique (EUR-ACE)' : 'Licence Finance & FinTech'}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Motifs du système : Baccalauréat Mathématiques obtenu avec mention. Résultats solides en mathématiques et algorithmique. Test QCM technique réussi avec 85% de bonnes réponses.
                </p>
              </div>

              {/* Candidate Aspiration Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Objectifs & Projet du Candidat</h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                  "{selectedCandidate.careerGoals}"
                </p>
              </div>

              {/* Responsible Decision & Adjustment */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold uppercase text-navy-900">Décision du Responsable Pédagogique</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Avis de la Commission</label>
                    <select
                      value={adjustedStatus}
                      onChange={e => setAdjustedStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    >
                      <option value="confirmed">Confirmer la recommandation IA (Favorable)</option>
                      <option value="adjusted">Réorienter vers une filière alternative</option>
                      <option value="supplement_needed">Demander un complément de notes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Observations du jury</label>
                    <input
                      type="text"
                      placeholder="Commentaire officiel pour le dossier..."
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleConfirmRecommendation}
                    className="px-6 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    Enregistrer la Délibération
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

