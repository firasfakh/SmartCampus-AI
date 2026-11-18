import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

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

const AppContent: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');

  // Role-based access control router guard
  const handleNavigate = (page: string) => {
    // Si un visiteur tente d'accéder à un espace candidat ou administratif
    const protectedPages = [
      'candidate-dashboard', 'profile', 'recommendations', 'pre-registration',
      'qcm', 'appointments', 'interview-prep', 'academic-iit', 'academic-isb',
      'interviews-workspace', 'direction-dashboard', 'admin-dashboard'
    ];

    if (protectedPages.includes(page) && !isAuthenticated) {
      setCurrentPage('login');
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
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
