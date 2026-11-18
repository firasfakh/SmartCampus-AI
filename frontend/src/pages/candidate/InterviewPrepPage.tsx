import React from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  FileCheck, 
  Award, 
  Lightbulb, 
  ArrowLeft,
  Calendar
} from 'lucide-react';

interface InterviewPrepPageProps {
  onNavigate: (page: string) => void;
}

export const InterviewPrepPage: React.FC<InterviewPrepPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
              <Sparkles className="w-4 h-4" />
              Guide Officiel de Réussite
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              Préparation à l'Entretien d'Admission
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Conseils, questions types et recommandations de nos jurys académiques de l'IIT et de l'ISB.
            </p>
          </div>

          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="text-xs font-semibold text-slate-600 hover:text-navy-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Appointment reminder card */}
        <div className="bg-purple-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-800 text-purple-200 px-2 py-0.5 rounded">
              Rendez-vous Confirmé
            </span>
            <h3 className="text-lg font-bold">15 Novembre 2026 à 10:00 (Durée : 45 min)</h3>
            <p className="text-xs text-purple-200">
              Campus IIT Sfax &bull; Jury : M. Mehdi Karray &bull; Salle B12
            </p>
          </div>
          <button
            onClick={() => onNavigate('appointments')}
            className="px-4 py-2 bg-white text-purple-900 font-bold text-xs rounded-xl hover:bg-purple-50 transition shrink-0"
          >
            Voir les détails
          </button>
        </div>

        {/* 3 Pillars of Evaluation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-sm font-bold text-navy-900">Projet & Motivation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Exprimez clairement pourquoi vous choisissez l'IIT ou l'ISB, votre vision de carrière et votre capacité d'engagement.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-sm font-bold text-navy-900">Compétences & Logique</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Le jury s'appuie sur votre score au QCM (85%) pour approfondir vos compétences en algorithmique et résolution de problèmes.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-sm font-bold text-navy-900">Communication & Langues</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Une partie de l'échange pourra se dérouler en anglais pour évaluer votre capacité à évoluer dans un contexte international EUR-ACE.
            </p>
          </div>
        </div>

        {/* Typical Questions Asked */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Exemples de Questions Types Fréquentes</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-navy-900">"Pouvez-vous nous présenter votre parcours et ce qui vous passionne dans les technologies numériques ?"</p>
              <p className="text-slate-500 mt-1 italic">&rarr; Conseil : Mettez en avant vos projets personnels ou scolaires et vos réalisations concrètes.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-navy-900">"Pourquoi avoir choisi l'IIT plutôt qu'une autre institution d'ingénierie ?"</p>
              <p className="text-slate-500 mt-1 italic">&rarr; Conseil : Citez l'accréditation EUR-ACE, la pédagogie par projets et l'ouverture internationale.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-navy-900">"How do you envision your professional career in 5 years after graduation?"</p>
              <p className="text-slate-500 mt-1 italic">&rarr; Conseil : Répondez en anglais avec assurance sur vos ambitions dans l'IA ou le Cloud.</p>
            </div>
          </div>
        </div>

        {/* Checklist documents to bring */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
          <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Checklist pour le Jour de l'Entretien</span>
          </h3>

          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pièce d'identité originale (CIN ou passeport en cours de validité).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Copies conformes des relevés de notes du Baccalauréat.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Attestation ou portfolio de projets personnels éventuels (code, github, activités associatives).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Se présenter 15 minutes à l'avance au bureau d'accueil du Campus IIT Sfax.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

