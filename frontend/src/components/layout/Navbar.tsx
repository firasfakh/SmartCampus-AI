import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../types';
import { 
  GraduationCap, 
  MessageSquareCode, 
  BookOpen, 
  Compass, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Globe, 
  LayoutDashboard,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const getDashboardPageForRole = (): { page: string; label: string } => {
    switch (role) {
      case 'candidate':
        return { page: 'candidate-dashboard', label: 'Espace Candidat' };
      case 'academic_iit':
        return { page: 'academic-iit', label: 'Espace Académique IIT' };
      case 'academic_isb':
        return { page: 'academic-isb', label: 'Espace Académique ISB' };
      case 'interview_resp':
        return { page: 'interviews-workspace', label: 'Espace Entretiens' };
      case 'direction':
        return { page: 'direction-dashboard', label: 'Direction Exécutive' };
      case 'admin':
        return { page: 'admin-dashboard', label: 'Administration' };
      default:
        return { page: 'home', label: 'Accueil' };
    }
  };

  const dashboardTarget = getDashboardPageForRole();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-md group-hover:bg-navy-800 transition">
              <GraduationCap className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-navy-900">
                  SmartCampus<span className="text-sky-600"> AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  IIT & ISB
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Orientation & Admission Universitaire Intelligente
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                currentPage === 'home' ? 'text-navy-900 bg-slate-100 font-semibold' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              Accueil
            </button>

            <button
              onClick={() => onNavigate('programs')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition ${
                currentPage === 'programs' ? 'text-navy-900 bg-slate-100 font-semibold' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-600" />
              Programmes
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition ${
                currentPage === 'chat' ? 'text-navy-900 bg-slate-100 font-semibold' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquareCode className="w-4 h-4 text-teal-600" />
              Assistant IA
            </button>

            {isAuthenticated && (
              <button
                onClick={() => onNavigate(dashboardTarget.page)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition ${
                  currentPage === dashboardTarget.page ? 'text-navy-900 bg-slate-100 font-semibold' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-purple-600" />
                {dashboardTarget.label}
              </button>
            )}
          </nav>

          {/* Language and user actions */}
          <div className="flex items-center gap-3">
            {/* Role Switcher Pill */}
            

            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-xs text-slate-600 hover:text-navy-900 font-medium px-2 py-1.5 rounded-lg border border-slate-200">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover:block z-50">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`w-full text-left px-3 py-1.5 text-xs ${language === 'fr' ? 'font-bold text-sky-600 bg-sky-50' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Français (FR)
                </button>
                <button
                  onClick={() => setLanguage('ar_tn')}
                  className={`w-full text-left px-3 py-1.5 text-xs ${language === 'ar_tn' ? 'font-bold text-sky-600 bg-sky-50' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  تونسية (العربية)
                </button>
                <button
                  onClick={() => setLanguage('arabizi')}
                  className={`w-full text-left px-3 py-1.5 text-xs ${language === 'arabizi' ? 'font-bold text-sky-600 bg-sky-50' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  Arabizi (Derja)
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`w-full text-left px-3 py-1.5 text-xs ${language === 'en' ? 'font-bold text-sky-600 bg-sky-50' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  English (EN)
                </button>
              </div>
            </div>

            {/* User Login/Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 hidden lg:inline">
                  {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-slate-100 rounded-lg transition"
                >
                  Connexion
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow-sm transition"
                >
                  Inscription
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

