import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Shield, ChevronDown, Check, UserCheck } from 'lucide-react';

const ROLES: { id: UserRole; label: string; desc: string; badge: string; color: string }[] = [
  { id: 'visitor', label: 'Visiteur', desc: 'Accès public & Découverte', badge: 'Public', color: 'bg-slate-100 text-slate-700' },
  { id: 'candidate', label: 'Candidat (Yassine)', desc: 'Dashboard & Candidature', badge: 'Futur Étudiant', color: 'bg-sky-100 text-sky-800' },
  { id: 'academic_iit', label: 'Resp. Académique IIT', desc: 'Génie & Technologies', badge: 'IIT Ingénieur', color: 'bg-blue-100 text-blue-800' },
  { id: 'academic_isb', label: 'Resp. Académique ISB', desc: 'Management & Business', badge: 'ISB Business', color: 'bg-teal-100 text-teal-800' },
  { id: 'interview_resp', label: 'Resp. Entretiens', desc: 'Audition & Validation QCM', badge: 'Admissions', color: 'bg-purple-100 text-purple-800' },
  { id: 'direction', label: 'Direction Générale', desc: 'Pilotage & Décision Exécutive', badge: 'Gouvernance', color: 'bg-amber-100 text-amber-800' },
  { id: 'admin', label: 'Administrateur', desc: 'Configuration système & RAG', badge: 'SuperAdmin', color: 'bg-red-100 text-red-800' },
];

export const RoleSwitcher: React.FC = () => {
  const { role, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentRoleObj = ROLES.find(r => r.id === role) || ROLES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 border border-navy-700 shadow-sm transition"
        title="Changer de rôle pour tester les vues spécialisées"
      >
        <Shield className="w-3.5 h-3.5 text-teal-400" />
        <span className="hidden sm:inline">Rôle actif :</span>
        <span className="text-teal-300 font-bold">{currentRoleObj.label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-navy-800" />
                Matrice des Rôles (SA-3 / SA-5)
              </p>
              <p className="text-[11px] text-slate-500">
                Basculez entre les espaces autorisés
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto py-1">
              {ROLES.map(r => {
                const isActive = r.id === role;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchRole(r.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                      isActive ? 'bg-slate-100 font-medium' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{r.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.color}`}>
                          {r.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

