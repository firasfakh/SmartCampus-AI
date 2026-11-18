import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';
import { OrientationRecommendation } from '../../types';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Cpu, 
  TrendingUp, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface RecommendationsPageProps {
  onNavigate: (page: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ onNavigate }) => {
  const [recommendations, setRecommendations] = useState<OrientationRecommendation[]>([]);

  useEffect(() => {
    const load = async () => {
      const profile = await candidateService.getProfile();
      const recs = await candidateService.getRecommendations(profile);
      setRecommendations(recs);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
              <Sparkles className="w-4 h-4" />
              Intelligence Artificielle d'Orientation
            </div>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
              Recommandations Académiques Personnalisées
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Calculées en croisant vos notes au Baccalauréat Mathématiques (15.42/20), vos intérêts pour l'IA et vos échanges avec l'assistant.
            </p>
          </div>
          <button
            onClick={() => onNavigate('programs')}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-navy-900 font-semibold text-xs transition shrink-0"
          >
            Comparer dans le catalogue
          </button>
        </div>

        {/* Disclaimer Card */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3 text-xs text-sky-900">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Ces scores d’affinité sont des indicateurs d'orientation calculés par nos modèles d'apprentissage. 
            <strong> L'admission officielle reste soumise à l'évaluation définitive de votre dossier et de votre entretien par le jury académique.</strong>
          </p>
        </div>

        {/* Recommendations list */}
        <div className="space-y-6">
          {recommendations.map((rec, index) => {
            const isTop = index === 0;
            return (
              <div
                key={rec.programId}
                className={`bg-white rounded-2xl border p-6 sm:p-8 shadow-xs transition ${
                  isTop ? 'border-sky-300 ring-2 ring-sky-100' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                        rec.program.institution === 'IIT' ? 'bg-sky-100 text-sky-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {rec.program.institution} &bull; {rec.program.level}
                      </span>
                      {isTop && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Meilleure Affinité
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-navy-900">{rec.program.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{rec.program.duration} &bull; {rec.program.tuitionPerYearTND} TND / an</p>
                  </div>

                  {/* Score badge */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl shrink-0">
                    <span className="text-xs text-slate-500">Affinité :</span>
                    <span className="text-xl font-extrabold text-navy-900">{rec.compatibilityScore}%</span>
                  </div>
                </div>

                {/* Reasons bullet points */}
                <div className="space-y-4 my-5 text-xs text-slate-700">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="font-bold text-navy-900 uppercase text-[11px]">Pourquoi cette recommandation ?</h4>
                    <ul className="space-y-1.5">
                      {rec.reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-slate-500 uppercase text-[10px] mb-1">Forces Académiques Valorisées</h4>
                      <p className="text-slate-800 font-medium">{rec.academicStrengths.join(', ')}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-500 uppercase text-[10px] mb-1">Débouchés Alignés</h4>
                      <p className="text-slate-800 font-medium">{rec.careerMatch}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-slate-500 font-medium">
                    {rec.suggestedAction}
                  </p>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onNavigate('pre-registration')}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <span>Postuler à cette formation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

