import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ClaimHistoryModal } from './components/common/ClaimHistoryModal';
import { UserRole } from './types';

// Pages
import { HomePage } from './pages/public/HomePage';
import { ProgramsPage } from './pages/public/ProgramsPage';
import { ChatAssistantPage } from './pages/candidate/ChatAssistantPage';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';
import { RecommendationsPage } from './pages/candidate/RecommendationsPage';
import { PreRegistrationPage } from './pages/candidate/PreRegistrationPage';
import { QCMPage } from './pages/candidate/QCMPage';
import { AppointmentsPage } from './pages/candidate/AppointmentsPage';
import { InterviewPrepPage } from './pages/candidate/InterviewPrepPage';
import { AcademicWorkspacePage } from './pages/academic/AcademicWorkspacePage';
import { InterviewWorkspacePage } from './pages/interview/InterviewWorkspacePage';
import { DirectionDashboard } from './pages/direction/DirectionDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Contrôle d'accès côté interface (le backend reste la vraie barrière de sécurité).
const PAGE_ROLES: Record<string, UserRole[]> = {
  'candidate-dashboard': ['candidate'],
  profile: ['candidate'],
  recommendations: ['candidate'],
  'pre-registration': ['candidate'],
  qcm: ['candidate'],
  appointments: ['candidate'],
  'interview-prep': ['candidate'],
  'academic-iit': ['academic_iit', 'admin'],
  'academic-isb': ['academic_isb', 'admin'],
  'interviews-workspace': ['interview_resp', 'admin'],
  'direction-dashboard': ['direction', 'admin'],
  'admin-dashboard': ['admin'],
};

const AppContent: React.FC = () => {
  const { role, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');

  // La vérification se fait au rendu (et non au clic) : juste après une connexion,
  // l'état d'authentification n'est pas encore à jour dans la fonction appelante.
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const protectedPage = !!PAGE_ROLES[currentPage];
  const allowed = !protectedPage || (isAuthenticated && PAGE_ROLES[currentPage].includes(role));

  const renderCurrentPage = () => {
    if (protectedPage && isLoading) return null;
    // Page protégée sans connexion : formulaire de connexion, puis retour à la page demandée.
    if (protectedPage && !isAuthenticated) return <LoginPage onNavigate={handleNavigate} redirectTo={currentPage} />;
    if (!allowed) {
      return (
        <div className="max-w-md mx-auto my-20 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <h2 className="text-lg font-bold text-navy-900">Accès refusé</h2>
          <p className="text-sm text-slate-600">Cet espace n'est pas accessible avec votre rôle.</p>
          <button onClick={() => handleNavigate('home')} className="px-4 py-2 rounded-lg bg-navy-900 text-white text-xs font-bold">
            Retour à l'accueil
          </button>
        </div>
      );
    }
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'programs':
        return <ProgramsPage onNavigate={handleNavigate} />;
      case 'chat':
        return <ChatAssistantPage onNavigate={handleNavigate} />;
      
      // Candidate routes
      case 'candidate-dashboard':
        return <CandidateDashboard onNavigate={handleNavigate} />;
      case 'profile':
        return <CandidateProfilePage onNavigate={handleNavigate} />;
      case 'recommendations':
        return <RecommendationsPage onNavigate={handleNavigate} />;
      case 'pre-registration':
        return <PreRegistrationPage onNavigate={handleNavigate} />;
      case 'qcm':
        return <QCMPage onNavigate={handleNavigate} />;
      case 'appointments':
        return <AppointmentsPage onNavigate={handleNavigate} />;
      case 'interview-prep':
        return <InterviewPrepPage onNavigate={handleNavigate} />;
      
      // Administrative workspaces (SA-3 / SA-5)
      case 'academic-iit':
        return <AcademicWorkspacePage onNavigate={handleNavigate} targetInstitution="IIT" />;
      case 'academic-isb':
        return <AcademicWorkspacePage onNavigate={handleNavigate} targetInstitution="ISB" />;
      case 'interviews-workspace':
        return <InterviewWorkspacePage onNavigate={handleNavigate} />;
      case 'direction-dashboard':
        return <DirectionDashboard onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      
      // Auth routes
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const isChatPage = currentPage === 'chat';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {!isChatPage && <Footer />}
      <ClaimHistoryModal />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
