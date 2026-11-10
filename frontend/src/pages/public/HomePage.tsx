import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  Sparkles, 
  Compass, 
  MessageSquare, 
  Cpu, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Mic, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  FileCheck, 
  Award, 
  Building
} from 'lucide-react';
import { OFFICIAL_PROGRAMS } from '../../data/officialPrograms';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const featuredPrograms = OFFICIAL_PROGRAMS.filter(p => p.featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/80 border border-navy-700 text-xs font-medium text-teal-300 shadow-sm backdrop-blur">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Orientation Universitaire Intelligente &bull; IIT & ISB Sfax</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Construisez votre avenir avec <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-sky-200">
              l'Intelligence Artificielle
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            SmartCampus AI vous guide pas à pas : dialoguez avec notre assistant virtuel (en français, arabe tunisien ou arabizi), découvrez vos filières de prédilection à l'<strong>IIT</strong> et l'<strong>ISB</strong>, et préparez votre admission en toute sérénité.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('chat')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-white font-semibold text-sm shadow-lg hover:from-sky-600 hover:to-teal-600 transition flex items-center justify-center gap-2 group"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Démarrer l'Orientation IA</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => onNavigate('programs')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Explorer les Formations</span>
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => onNavigate('register')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-navy-950 font-bold text-sm shadow-md hover:bg-slate-100 transition"
              >
                Déposer ma Préinscription
              </button>
            )}
          </div>

          {/* Key Trust Badges */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center max-w-3xl mx-auto border-t border-navy-800/60 mt-10">
            <div className="p-2">
              <p className="text-xl font-bold text-white">EUR-ACE</p>
              <p className="text-[11px] text-slate-400">Accréditation Européenne</p>
            </div>
            <div className="p-2">
              <p className="text-xl font-bold text-teal-400">94%</p>
              <p className="text-[11px] text-slate-400">Insertion Professionnelle</p>
            </div>
            <div className="p-2">
              <p className="text-xl font-bold text-sky-400">2 Pôles</p>
              <p className="text-[11px] text-slate-400">Ingénierie (IIT) & Business (ISB)</p>
            </div>
            <div className="p-2">
              <p className="text-xl font-bold text-white">Multilingue</p>
              <p className="text-[11px] text-slate-400">Français, Derja, Vocal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two Institutions Presentation (IIT vs ISB) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">Campus Universitaire de Sfax</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900">Deux Pôles d'Excellence Complémentaires</h3>
          <p className="text-sm text-slate-600 mt-2">
            Des formations habilitées par l'État et conçues en étroite synergie avec le tissu industriel tunisien et international.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* IIT Card */}
          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-8 hover:shadow-md transition relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
              <Cpu className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-sky-100 text-sky-800 uppercase tracking-wider">
              Institut International de Technologie
            </span>
            <h4 className="text-xl font-bold text-navy-900 mt-3 mb-2">Pôle Ingénierie & Hautes Technologies (IIT)</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Formations d'ingénieurs accréditées EUR-ACE alliant rigueur scientifique, innovation technologique et immersion internationale.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Génie Informatique : IA, Cloud Native & Cybersécurité</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Génie Civil : Modélisation BIM, Éco-construction & BTP</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Génie Industriel : Supply Chain Globale & Industrie 4.0</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Cycle Préparatoire Intégré direct sans concours national</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigate('programs')}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 group-hover:gap-2 transition"
            >
              <span>Découvrir toutes les filières IIT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ISB Card */}
          <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-8 hover:shadow-md transition relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-teal-100 text-teal-800 uppercase tracking-wider">
              International School of Business
            </span>
            <h4 className="text-xl font-bold text-navy-900 mt-3 mb-2">Pôle Management & Finance Digitale (ISB)</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              École de management formant les futurs leaders de l’économie numérique, de la finance moderne et de la stratégie d’entreprise.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Master Business Analytics & Big Data pour décideurs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Licence FinTech & Technologies Financières</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Management, Stratégie Globale & Entrepreneuriat</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Finance Internationale & Ingénierie Financière M&A</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigate('programs')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 group-hover:gap-2 transition"
            >
              <span>Découvrir toutes les filières ISB</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* How it Works / 10 Stages Journey */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">Parcours Candidat Intelligent</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-navy-900">De l'Orientation à l'Admission Finale</h3>
            <p className="text-sm text-slate-600 mt-2">
              Un accompagnement complet associant l'intelligence artificielle agentique à la décision officielle de nos responsables pédagogiques.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-navy-900 text-sky-400 flex items-center justify-center text-sm font-bold">1</div>
              <h4 className="text-sm font-bold text-navy-900">Dialogue IA Multilingue</h4>
              <p className="text-xs text-slate-600">Discutez en français ou en derja par texte ou voix avec l’assistant qui analyse votre profil.</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-navy-900 text-sky-400 flex items-center justify-center text-sm font-bold">2</div>
              <h4 className="text-sm font-bold text-navy-900">Recommandations & Comparateur</h4>
              <p className="text-xs text-slate-600">Recevez des scores d’affinité clairs et comparez les filières IIT et ISB côte à côte.</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-navy-900 text-sky-400 flex items-center justify-center text-sm font-bold">3</div>
              <h4 className="text-sm font-bold text-navy-900">Préinscription & QCM Adaptatif</h4>
              <p className="text-xs text-slate-600">Téléversez vos pièces justificatives et passez un QCM sur mesure pour valider vos aptitudes.</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-navy-900 text-sky-400 flex items-center justify-center text-sm font-bold">4</div>
              <h4 className="text-sm font-bold text-navy-900">Entretien & Admission Définitive</h4>
              <p className="text-xs text-slate-600">Planifiez votre entretien d’admission (en présentiel à Sfax ou en ligne) avec le jury académique.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programs Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">Formations Phares</h2>
            <h3 className="text-2xl font-extrabold text-navy-900">Sélection des Programmes les Plus Demandés</h3>
          </div>
          <button
            onClick={() => onNavigate('programs')}
            className="mt-3 sm:mt-0 text-xs font-bold text-navy-900 hover:text-sky-600 flex items-center gap-1"
          >
            <span>Voir l'ensemble des programmes (9)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPrograms.map(program => (
            <div key={program.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    program.institution === 'IIT' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}>
                    {program.institution} &bull; {program.level}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">{program.duration}</span>
                </div>
                <h4 className="text-sm font-bold text-navy-900 mb-2 leading-snug">{program.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{program.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Frais annuels</span>
                  <span className="text-xs font-bold text-navy-900">{program.tuitionPerYearTND} TND</span>
                </div>
                <button
                  onClick={() => onNavigate('programs')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Human + AI Disclaimer Banner */}
      <section className="bg-navy-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-y border-navy-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="text-center sm:text-left">
            <h4 className="text-base font-bold text-white mb-1">
              Gouvernance Pédagogique & Éthique de l'IA
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sur SmartCampus AI, l'intelligence artificielle analyse, recommande et conseille sur la base des règlements officiels. Toutefois, <strong>l'ensemble des décisions d'admission, d'équivalence de diplôme et de délibération restent sous la responsabilité exclusive des jurys et responsables académiques humains de l'IIT et de l'ISB</strong>.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

