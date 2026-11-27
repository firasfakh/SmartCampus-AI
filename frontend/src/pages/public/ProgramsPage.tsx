import React, { useState } from 'react';
import { useCatalogPrograms } from '../../services/catalogService';
import { Program, Institution } from '../../types';
import { 
  Search, 
  Filter, 
  BookOpen, 
  ArrowLeftRight, 
  Check, 
  X, 
  Cpu, 
  TrendingUp, 
  GraduationCap, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface ProgramsPageProps {
  onNavigate: (page: string) => void;
}

export const ProgramsPage: React.FC<ProgramsPageProps> = ({ onNavigate }) => {
  const { programs, source } = useCatalogPrograms();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<'ALL' | Institution>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  
  // Comparateur d'offres de formation
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isComparingModalOpen, setIsComparingModalOpen] = useState(false);
  
  // Modal de détail d'un programme
  const [activeModalProgram, setActiveModalProgram] = useState<Program | null>(null);

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesInst = selectedInstitution === 'ALL' || p.institution === selectedInstitution;
    const matchesLevel = selectedLevel === 'ALL' || p.level === selectedLevel;

    return matchesSearch && matchesInst && matchesLevel;
  });

  const toggleCompare = (programId: string) => {
    if (compareList.includes(programId)) {
      setCompareList(prev => prev.filter(id => id !== programId));
    } else {
      if (compareList.length >= 3) {
        window.alert("Vous pouvez comparer au maximum 3 programmes simultanément.");
        return;
      }
      setCompareList(prev => [...prev, programId]);
    }
  };

  const comparedPrograms = programs.filter(p => compareList.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">
              <BookOpen className="w-4 h-4" />
              Catalogue 2026-2027
              <span className={`ml-2 normal-case tracking-normal font-semibold px-2 py-0.5 rounded ${
                source === 'api' ? 'bg-emerald-50 text-emerald-700' : source === 'offline' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {source === 'api' ? 'Données de la plateforme' : source === 'offline' ? 'Mode hors ligne (données locales)' : 'Chargement…'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
              Formations Académiques & Diplômes
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Explorez les cursus d’excellence de l’<strong>IIT</strong> (Pôle Ingénierie & Informatique) et de l’<strong>ISB</strong> (Pôle Management, Finance & Business Analytics).
            </p>
          </div>

          {/* Comparateur Floating trigger */}
          {compareList.length > 0 && (
            <button
              onClick={() => setIsComparingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-xs shadow-lg hover:bg-navy-800 transition shrink-0 animate-in fade-in"
            >
              <ArrowLeftRight className="w-4 h-4 text-teal-400" />
              <span>Comparer ({compareList.length}/3)</span>
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une formation (ex: Informatique, Finance, Civil)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Institution Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedInstitution('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  selectedInstitution === 'ALL' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setSelectedInstitution('IIT')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
                  selectedInstitution === 'IIT' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3 h-3" />
                IIT (Ingénierie)
              </button>
              <button
                onClick={() => setSelectedInstitution('ISB')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
                  selectedInstitution === 'ISB' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                ISB (Business)
              </button>
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Tous les Niveaux</option>
              <option value="Licence">Licence (Bac+3)</option>
              <option value="Master">Master (Bac+5)</option>
              <option value="Ingénieur">Cycle Ingénieur (EUR-ACE)</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{filteredPrograms.length} formation{filteredPrograms.length > 1 ? 's' : ''} disponible{filteredPrograms.length > 1 ? 's' : ''}</span>
          <span className="text-[11px]">Cochez "Comparer" pour juxtaposer jusqu'à 3 programmes</span>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map(program => {
            const isCompared = compareList.includes(program.id);
            return (
              <div 
                key={program.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      program.institution === 'IIT' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}>
                      {program.institution} &bull; {program.level}
                    </span>
                    <button
                      onClick={() => toggleCompare(program.id)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md border flex items-center gap-1 transition ${
                        isCompared 
                          ? 'bg-navy-900 border-navy-900 text-white' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {isCompared ? <Check className="w-3 h-3 text-teal-400" /> : <ArrowLeftRight className="w-3 h-3" />}
                      <span>{isCompared ? 'Sélectionné' : 'Comparer'}</span>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-navy-900 mb-2 leading-snug">
                    {program.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                    {program.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Durée :</span>
                      <span className="font-semibold text-slate-800">{program.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Frais d'études :</span>
                      <span className="font-semibold text-navy-900">{program.tuitionPerYearTND} TND / an</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setActiveModalProgram(program)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-center"
                  >
                    Fiche Complète
                  </button>
                  <button
                    onClick={() => onNavigate('chat')}
                    className="py-2 px-3 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition flex items-center gap-1"
                    title="Poser des questions à l'IA sur cette formation"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Orienter</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Program Detail Modal */}
      {activeModalProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  activeModalProgram.institution === 'IIT' ? 'bg-sky-50 text-sky-700' : 'bg-teal-50 text-teal-700'
                }`}>
                  {activeModalProgram.institution} &bull; {activeModalProgram.level}
                </span>
                <h3 className="text-xl font-bold text-navy-900 mt-1">{activeModalProgram.name}</h3>
                <p className="text-xs text-slate-500">Code : {activeModalProgram.code} &bull; Durée : {activeModalProgram.duration}</p>
              </div>
              <button
                onClick={() => setActiveModalProgram(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-navy-900 uppercase text-[11px] mb-1">Présentation de la filière</h4>
                <p className="text-slate-600 leading-relaxed">{activeModalProgram.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-navy-900 uppercase text-[11px] mb-2">Conditions d'admission & Prérequis</h4>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                  {activeModalProgram.prerequisites.map((prereq, i) => (
                    <li key={i}>{prereq}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-navy-900 uppercase text-[11px] mb-2">Points forts du programme pédagogique</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeModalProgram.curriculumHighlights.map((item, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-navy-900 uppercase text-[11px] mb-2">Débouchés & Carrières visées</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalProgram.careerOpportunities.map((career, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {career}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Frais annuels de scolarité</span>
                  <span className="text-base font-extrabold text-navy-900">{activeModalProgram.tuitionPerYearTND} TND</span>
                  <span className="text-[10px] text-slate-400 block">Facilités en 4 tranches disponibles</span>
                </div>
                <button
                  onClick={() => {
                    setActiveModalProgram(null);
                    onNavigate('pre-registration');
                  }}
                  className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition"
                >
                  Postuler à ce Programme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Comparator Modal (Juxtapose 2-3 programs) */}
      {isComparingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase">
                  <ArrowLeftRight className="w-4 h-4" />
                  Comparateur Pédagogique Intelligent
                </div>
                <h3 className="text-xl font-bold text-navy-900 mt-1">Comparaison des Cursus Sélectionnés</h3>
              </div>
              <button
                onClick={() => setIsComparingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparedPrograms.map(prog => (
                <div key={prog.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      prog.institution === 'IIT' ? 'bg-sky-100 text-sky-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {prog.institution} &bull; {prog.level}
                    </span>
                    <h4 className="font-bold text-navy-900 text-sm mt-1">{prog.name}</h4>
                    <p className="text-xs font-bold text-sky-700 mt-1">{prog.tuitionPerYearTND} TND / an</p>
                  </div>

                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-1">Durée & Rythme</h5>
                    <p className="text-xs text-slate-700 font-medium">{prog.duration}</p>
                  </div>

                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-1">Prérequis</h5>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {prog.prerequisites.slice(0, 2).map((p, i) => (
                        <li key={i}>&bull; {p}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-1">Débouchés clés</h5>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {prog.careerOpportunities.slice(0, 3).map((c, i) => (
                        <li key={i}>&bull; {c}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setIsComparingModalOpen(false);
                      onNavigate('chat');
                    }}
                    className="w-full py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Orienter avec l'IA
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

