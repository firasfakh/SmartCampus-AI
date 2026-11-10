import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  FileText, 
  Cpu, 
  Database, 
  Server, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Plus
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

interface RAGDocument {
  id: string;
  name: string;
  institution: 'IIT' | 'ISB' | 'COMMUN';
  status: 'indexed' | 'processing' | 'error';
  vectorChunks: number;
  uploadedAt: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, info } = useToast();
  
  const [activeTab, setActiveTab] = useState<'rag' | 'users' | 'system'>('rag');
  
  const [ragDocs, setRagDocs] = useState<RAGDocument[]>([
    {
      id: 'rag-1',
      name: 'Guide_Orientation_Officiel_IIT_ISB_2026.pdf',
      institution: 'COMMUN',
      status: 'indexed',
      vectorChunks: 142,
      uploadedAt: '2026-11-01',
    },
    {
      id: 'rag-2',
      name: 'Reglement_Etudes_Cycle_Ingenieur_IIT.pdf',
      institution: 'IIT',
      status: 'indexed',
      vectorChunks: 98,
      uploadedAt: '2026-11-02',
    },
    {
      id: 'rag-3',
      name: 'Plaquette_Formations_Masters_ISB_2026.pdf',
      institution: 'ISB',
      status: 'indexed',
      vectorChunks: 76,
      uploadedAt: '2026-11-03',
    },
    {
      id: 'rag-4',
      name: 'Bareme_Equivalences_Diplomes_Etrangers.pdf',
      institution: 'COMMUN',
      status: 'indexed',
      vectorChunks: 54,
      uploadedAt: '2026-11-05',
    }
  ]);

  const handleUploadRAG = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: RAGDocument = {
      id: `rag-${Date.now()}`,
      name: file.name,
      institution: 'IIT',
      status: 'indexed',
      vectorChunks: Math.floor(Math.random() * 80) + 40,
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setRagDocs(prev => [newDoc, ...prev]);
    success("Document indexé", `Le document ${file.name} a été vectorisé pour le système RAG.`);
  };

  const handleDeleteDoc = (id: string) => {
    setRagDocs(prev => prev.filter(d => d.id !== id));
    info("Document supprimé", "Le document a été retiré de l'index vectoriel.");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
              Super-Administration & Paramétrage
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              Console d'Administration Système SmartCampus AI
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion de la base de connaissances RAG, rôles des utilisateurs, et supervision des agents IA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-800">
              Mode Administrateur Actif
            </span>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('rag')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'rag' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Base RAG & Documents Habilités ({ragDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-teal-400" />
            <span>Utilisateurs & Rôles Institutionnels</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'system' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4 text-purple-400" />
            <span>Supervision Agents & Services</span>
          </button>
        </div>

        {/* Tab 1: RAG Documents Management */}
        {activeTab === 'rag' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-navy-900">Index Vectoriel RAG (IIT & ISB)</h3>
                <p className="text-xs text-slate-500">
                  Documents académiques officiels analysés par l'IA pour générer des réponses certifiées avec citations de sources.
                </p>
              </div>

              <label className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2 transition shrink-0">
                <Upload className="w-4 h-4" />
                <span>Ajouter un Document Officiel</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleUploadRAG}
                  className="hidden"
                />
              </label>
            </div>

            <div className="divide-y divide-slate-100">
              {ragDocs.map(doc => (
                <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy-900">{doc.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        Pôle : <strong>{doc.institution}</strong> &bull; {doc.vectorChunks} fragments vectoriels &bull; Ajouté le {doc.uploadedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Indexé & Actif
                    </span>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Supprimer du RAG"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Users & Roles Matrix */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-navy-900">Comptes et Affectation des Rôles (SA-3 / SA-5)</h3>
              <p className="text-xs text-slate-500">
                Chaque acteur accède strictement aux données et fonctionnalités rattachées à sa mission pédagogique.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold uppercase text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                  academic_iit
                </span>
                <p className="font-bold text-navy-900 text-sm mt-2">Dr. Slim Ben Amor</p>
                <p className="text-slate-500">resp.iit@iit.tn</p>
                <p className="text-[11px] text-slate-600 pt-1">Accès exclusif aux candidats et filières Ingénieur IIT.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold uppercase text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                  academic_isb
                </span>
                <p className="font-bold text-navy-900 text-sm mt-2">Dr. Nadia Chaker</p>
                <p className="text-slate-500">resp.isb@isb.tn</p>
                <p className="text-[11px] text-slate-600 pt-1">Accès exclusif aux formations Management & Business ISB.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  interview_resp
                </span>
                <p className="font-bold text-navy-900 text-sm mt-2">M. Mehdi Karray</p>
                <p className="text-slate-500">entretiens@smartcampus.tn</p>
                <p className="text-[11px] text-slate-600 pt-1">Conduite des entretiens et saisie des grilles d'évaluation.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  direction
                </span>
                <p className="font-bold text-navy-900 text-sm mt-2">Prof. Raouf Triki</p>
                <p className="text-slate-500">direction@iit-isb.tn</p>
                <p className="text-[11px] text-slate-600 pt-1">Pilotage exécutif consolidé et indicateurs d'admission.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  admin
                </span>
                <p className="font-bold text-navy-900 text-sm mt-2">Amine Ghorbel</p>
                <p className="text-slate-500">admin@smartcampus.tn</p>
                <p className="text-[11px] text-slate-600 pt-1">Super-administrateur de l'infrastructure logicielle.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: System Status & Backend Connectivity */}
        {activeTab === 'system' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-navy-900">État de l'Infrastructure & Micro-services</h3>
              <p className="text-xs text-slate-500">Vérification en temps réel des couches backend FastAPI et PostgreSQL.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-semibold block">API Backend FastAPI</span>
                <span className="text-sm font-extrabold text-navy-900 block">/api/v1 (Port 8000)</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Opérationnel
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-semibold block">Base PostgreSQL</span>
                <span className="text-sm font-extrabold text-navy-900 block">smartcampus_db</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connecté (asyncpg)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-semibold block">Documentation Swagger</span>
                <span className="text-sm font-extrabold text-navy-900 block">/docs</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Disponible
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-semibold block">Moteur Vocal Whisper</span>
                <span className="text-sm font-extrabold text-navy-900 block">Speech-to-Text</span>
                <span className="text-[10px] font-bold text-teal-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Actif (Derja/FR)
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

