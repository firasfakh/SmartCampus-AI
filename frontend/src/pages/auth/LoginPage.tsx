import React, { useState } from 'react';
import { GraduationCap, LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../services/api';

interface LoginPageProps { onNavigate: (page: string) => void; redirectTo?: string; }

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, redirectTo }) => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const user = await login({ email, password });
      success('Connexion réussie', `Bienvenue ${[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}.`);
      const destinations: Record<string, string> = {
        candidate: 'candidate-dashboard',
        academic_iit: 'academic-iit',
        academic_isb: 'academic-isb',
        interview_resp: 'interviews-workspace',
        direction: 'direction-dashboard',
        admin: 'admin-dashboard',
      };
      onNavigate(redirectTo || destinations[user.role] || 'home');
    } catch (e) {
      error('Connexion impossible', errorMessage(e, 'Vérifiez votre adresse e-mail et votre mot de passe.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-slate-50">
      <form onSubmit={handleSubmit} className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-navy-900 text-sky-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-navy-900">Connexion à SmartCampus AI</h2>
          <p className="text-xs text-slate-500">Candidats et personnel IIT / ISB.</p>
        </div>
        <label className="block text-sm font-semibold text-slate-700">
          Adresse e-mail
          <span className="relative mt-1 block">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input type="email" autoComplete="username" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm"
              placeholder="nom@domaine.tn" />
          </span>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Mot de passe
          <span className="relative mt-1 block">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input type="password" autoComplete="current-password" required value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm"
              placeholder="Votre mot de passe" />
          </span>
        </label>
        <button type="submit" disabled={isLoading}
          className="w-full rounded-xl bg-navy-900 py-3 text-sm font-bold text-white disabled:opacity-60">
          <span className="inline-flex items-center gap-2"><LogIn className="h-4 w-4" />{isLoading ? 'Connexion...' : 'Se connecter'}</span>
        </button>
        {import.meta.env.DEV && (
          <details className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <summary className="cursor-pointer font-semibold text-slate-600">Comptes de démonstration (développement)</summary>
            <p className="mt-2">Disponibles après <code>python -m scripts.seed_demo</code> — mot de passe : <code>SmartCampus2026!</code></p>
            <ul className="mt-1 space-y-0.5 font-mono">
              <li>candidat@smartcampus.example</li>
              <li>resp.iit@smartcampus.example · resp.isb@smartcampus.example</li>
              <li>entretien.iit@smartcampus.example · direction@smartcampus.example</li>
              <li>admin@smartcampus.example</li>
            </ul>
          </details>
        )}
        <p className="text-center text-xs text-slate-500">
          Vous n'avez pas de compte ?{' '}
          <button type="button" onClick={() => onNavigate('register')} className="font-bold text-sky-700 hover:underline">Créer un compte candidat</button>
        </p>
      </form>
    </div>
  );
};
