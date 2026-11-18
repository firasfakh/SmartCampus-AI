import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { 
  GraduationCap, 
  LogIn, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('yassine.trabelsi@gmail.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('candidate');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password, role: selectedRole });
      success("Connexion réussie", `Bienvenue sur SmartCampus AI en tant que ${selectedRole}.`);
      if (selectedRole === 'candidate') {
        onNavigate('candidate-dashboard');
      } else if (selectedRole === 'academic_iit') {
        onNavigate('academic-iit');
      } else if (selectedRole === 'academic_isb') {
        onNavigate('academic-isb');
      } else if (selectedRole === 'interview_resp') {
        onNavigate('interviews-workspace');
      } else if (selectedRole === 'direction') {
        onNavigate('direction-dashboard');
      } else if (selectedRole === 'admin') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('home');
      }
    } catch {
      error("Erreur de connexion", "Vérifiez vos identifiants ou essayez l'un des comptes de test.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-navy-900 text-sky-400 flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Connexion à SmartCampus AI
          </h2>
          <p className="text-xs text-slate-500">
            Accédez à votre espace candidat ou à votre environnement administratif officiel
          </p>
        </div>

        {/* Quick Demo Role Picker Pill */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
          <span className="font-bold text-navy-900 text-[11px] block">Sélection rapide du profil de démonstration :</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => { setSelectedRole('candidate'); setEmail('yassine.trabelsi@gmail.com'); }}
              className={`p-1.5 rounded-lg border text-left text-[11px] ${selectedRole === 'candidate' ? 'bg-sky-50 border-sky-400 font-bold text-sky-900' : 'bg-white text-slate-600'}`}
            >
              Candidat (Yassine)
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('academic_iit'); setEmail('resp.iit@iit.tn'); }}
              className={`p-1.5 rounded-lg border text-left text-[11px] ${selectedRole === 'academic_iit' ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white text-slate-600'}`}
            >
              Resp. Académique IIT
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('academic_isb'); setEmail('resp.isb@isb.tn'); }}
              className={`p-1.5 rounded-lg border text-left text-[11px] ${selectedRole === 'academic_isb' ? 'bg-teal-50 border-teal-400 font-bold text-teal-900' : 'bg-white text-slate-600'}`}
            >
              Resp. Académique ISB
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('interview_resp'); setEmail('entretiens@smartcampus.tn'); }}
              className={`p-1.5 rounded-lg border text-left text-[11px] ${selectedRole === 'interview_resp' ? 'bg-purple-50 border-purple-400 font-bold text-purple-900' : 'bg-white text-slate-600'}`}
            >
              Resp. Entretiens
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('direction'); setEmail('direction@iit-isb.tn'); }}
              className={`p-1.5 rounded-lg border text-left text-[11px] ${selectedRole === 'direction' ? 'bg-amber-50 border-amber-400 font-bold text-amber-900' : 'bg-white text-slate-600'}`}
            >
              Direction Exécutive
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('admin'); setEmail('admin@smartcampus.tn'); }}
              className={`p-1.5 rounded-lg border text-left text-[11px] ${selectedRole === 'admin' ? 'bg-red-50 border-red-400 font-bold text-red-900' : 'bg-white text-slate-600'}`}
            >
              Administrateur
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Identifiant ou Email institutionnel</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Connexion en cours...' : 'Se connecter'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Vous n'avez pas encore de compte candidat ?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-bold text-sky-600 hover:text-sky-700"
          >
            Créer un compte
          </button>
        </div>

      </div>
    </div>
  );
};

