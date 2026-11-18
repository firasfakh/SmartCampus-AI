import React, { useState, useEffect } from 'react';
import { qcmService } from '../../services/qcmService';
import { QCMTest } from '../../types';
import { useToast } from '../../context/ToastContext';
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  ArrowRight, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface QCMPageProps {
  onNavigate: (page: string) => void;
}

export const QCMPage: React.FC<QCMPageProps> = ({ onNavigate }) => {
  const { success } = useToast();
  const [test, setTest] = useState<QCMTest | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const t = await qcmService.getPersonalizedTest();
      setTest(t);
      if (t.status === 'completed') {
        setUserAnswers(t.answers || {});
        setIsCompleted(true);
      }
    };
    load();
  }, []);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isCompleted) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = async () => {
    if (!test) return;
    const res = await qcmService.submitAnswers(test.id, userAnswers);
    setTest(res);
    setIsCompleted(true);
    success("Test validé !", `Votre score est de ${res.score}%. Les résultats sont transmis au jury d'entretien.`);
  };

  const handleRetake = () => {
    setUserAnswers({});
    setIsCompleted(false);
    setCurrentQuestionIdx(0);
  };

  if (!test) return null;

  const currentQ = test.questions[currentQuestionIdx];
  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
              <ClipboardCheck className="w-4 h-4" />
              Évaluation Pédagogique Pré-Entretien
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              QCM Personnalisé &bull; {test.programName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Évalue les prérequis techniques, logiques et linguistiques indispensables au cycle ingénieur IIT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-200 text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{test.durationMinutes} minutes</span>
            </span>
          </div>
        </div>

        {/* Results View if Completed */}
        {isCompleted ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2 border-b border-slate-100 pb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Award className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                Test Validé avec Succès
              </span>
              <h2 className="text-3xl font-extrabold text-navy-900">
                Score Obtenu : <span className="text-emerald-600">{test.score}%</span>
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ce résultat confirme l'adéquation de votre profil avec le Cycle Ingénieur Génie Informatique. Il a été transmis au responsable de l'entretien.
              </p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Points Forts Relevés
                </h4>
                <ul className="space-y-1.5 text-emerald-800">
                  {test.strengths?.map((s, i) => (
                    <li key={i}>&bull; {s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5 uppercase text-[11px]">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Axes de Perfectionnement
                </h4>
                <ul className="space-y-1.5 text-amber-800">
                  {test.improvements?.map((imp, i) => (
                    <li key={i}>&bull; {imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleRetake}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repasser le test</span>
              </button>

              <button
                onClick={() => onNavigate('interview-prep')}
                className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
              >
                <span>Préparer l'Entretien</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Runner View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Question {currentQuestionIdx + 1} sur {totalQuestions}</span>
                <span>{answeredCount}/{totalQuestions} répondues</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-navy-900 transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="space-y-4 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                Catégorie : {currentQ.category}
              </span>
              <h3 className="text-base font-bold text-navy-900 leading-snug">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((option, idx) => {
                  const isSelected = userAnswers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      className={`w-full text-left p-3.5 rounded-xl text-xs font-medium border transition flex items-center justify-between ${
                        isSelected 
                          ? 'bg-sky-50 border-sky-400 text-navy-950 font-bold shadow-xs' 
                          : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{option}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIdx === 0}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-navy-900 disabled:opacity-30"
              >
                Précédent
              </button>

              {currentQuestionIdx < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs transition"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={answeredCount < totalQuestions}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition"
                >
                  Valider et Voir mes Résultats
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

