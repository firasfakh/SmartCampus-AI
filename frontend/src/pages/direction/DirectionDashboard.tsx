import React, { useState, useEffect } from 'react';
import { directionService } from '../../services/directionService';
import { DirectionMetrics } from '../../types';
import { useToast } from '../../context/ToastContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileCheck, 
  GraduationCap, 
  Download, 
  Cpu, 
  Sparkles, 
  Building2,
  Calendar,
  Layers
} from 'lucide-react';

interface DirectionDashboardProps {
  onNavigate: (page: string) => void;
}

export const DirectionDashboard: React.FC<DirectionDashboardProps> = ({ onNavigate }) => {
  const { success } = useToast();
  const [metrics, setMetrics] = useState<DirectionMetrics | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await directionService.getMetrics();
      setMetrics(data);
    };
    load();
  }, []);

  const handleExport = async () => {
    await directionService.exportReportPdf();
    success("Rapport Exécutif", "Le rapport de pilotage a été généré pour impression / export PDF.");
  };

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              Direction Générale &bull; Tableau de Bord Exécutif
            </div>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
              Pilotage des Admissions & Performance IA
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Indicateurs consolidés de la campagne d'admission 2026-2027 pour l'IIT et l'ISB.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exporter le Rapport Exécutif</span>
          </button>
        </div>

        {/* Top KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Conversations IA</span>
            <span className="text-2xl font-extrabold text-navy-900 mt-1 block">{metrics.totalConversations}</span>
            <span className="text-[10px] text-teal-600 font-bold mt-1 block">+28% vs année N-1</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Candidats Qualifiés</span>
            <span className="text-2xl font-extrabold text-navy-900 mt-1 block">{metrics.totalCandidates}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Profils complets</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Dossiers Préinscriptions</span>
            <span className="text-2xl font-extrabold text-sky-700 mt-1 block">{metrics.totalPreRegistrations}</span>
            <span className="text-[10px] text-sky-600 font-bold mt-1 block">51.6% de conversion</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Entretiens Réalisés</span>
            <span className="text-2xl font-extrabold text-purple-700 mt-1 block">{metrics.totalInterviewsCompleted}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Auditions jurys</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Admissions Finales</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{metrics.finalAdmissionsCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">18.5% conversion globale</span>
          </div>

        </div>

        {/* Comparison: IIT vs ISB */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* IIT Card */}
          <div className="bg-white rounded-2xl border border-sky-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900">Pôle Ingénierie & Technologie (IIT)</h3>
                  <p className="text-[11px] text-slate-500">60% du volume des candidatures</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                {metrics.iitCandidatesCount} Candidats
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>Préinscriptions déposées</span>
                  <span className="font-bold text-navy-900">{metrics.iitPreRegistrationsCount}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-sky-600" style={{ width: `${(metrics.iitPreRegistrationsCount / metrics.iitCandidatesCount) * 100}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                <span className="font-bold text-navy-900">Spécialité la plus demandée :</span>
                <p className="text-slate-600">Génie Informatique (IA & Cloud) — 245 candidats</p>
              </div>
            </div>
          </div>

          {/* ISB Card */}
          <div className="bg-white rounded-2xl border border-teal-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900">Pôle Management & Business (ISB)</h3>
                  <p className="text-[11px] text-slate-500">40% du volume des candidatures</p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                {metrics.isbCandidatesCount} Candidats
              </span>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>Préinscriptions déposées</span>
                  <span className="font-bold text-navy-900">{metrics.isbPreRegistrationsCount}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-teal-600" style={{ width: `${(metrics.isbPreRegistrationsCount / metrics.isbCandidatesCount) * 100}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                <span className="font-bold text-navy-900">Spécialité la plus demandée :</span>
                <p className="text-slate-600">Master Business Analytics & Big Data — 128 candidats</p>
              </div>
            </div>
          </div>

        </div>

        {/* Funnel Conversion & Top Programs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Entonnoir de Conversion des Admissions</span>
            </h3>

            <div className="space-y-2.5 pt-1">
              {metrics.funnelStages.map((stage, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{stage.name}</span>
                    <span className="font-bold text-navy-900">{stage.count} ({stage.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-navy-800 to-sky-600"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Programs Demand */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <span>Top des Filières les Plus Plébiscitées</span>
            </h3>

            <div className="space-y-3 pt-1">
              {metrics.topPrograms.map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-navy-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.institution}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-navy-900">{p.candidateCount} candidats</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* AI Assistant Metrics Banner */}
        <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-teal-400 bg-navy-800 px-2 py-0.5 rounded">
              Performance des Agents IA
            </span>
            <h4 className="text-sm font-bold text-white">4 210 requêtes RAG traitées sans hallucination</h4>
            <p className="text-xs text-slate-300">
              Temps de réponse moyen : <strong>1.2 seconde</strong> &bull; Taux de satisfaction candidats : <strong>96.4%</strong>
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition shrink-0"
          >
            Consulter les logs système
          </button>
        </div>

      </div>
    </div>
  );
};

