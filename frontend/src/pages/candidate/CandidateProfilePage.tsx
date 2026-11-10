import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';
import { CandidateProfile } from '../../types';
import { useToast } from '../../context/ToastContext';
import { User, Save, GraduationCap, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface CandidateProfilePageProps {
  onNavigate: (page: string) => void;
}

export const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({ onNavigate }) => {
  const { success } = useToast();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const p = await candidateService.getProfile();
      setProfile(p);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = await candidateService.updateProfile(profile);
      setProfile(updated);
      success("Profil mis à jour", "Vos informations académiques ont été enregistrées avec succès.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Profil Académique & Candidature</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ces données alimentent l'algorithme d'orientation et les recommandations officielles.
            </p>
          </div>
          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="text-xs font-semibold text-slate-600 hover:text-navy-900"
          >
            &larr; Retour au Dashboard
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          
          {/* Section 1: Informations Personnelles */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600" />
              État Civil & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Prénom</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom de famille</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Adresse Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Téléphone mobile</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Parcours & Baccalauréat */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-sky-600" />
              Parcours Académique & Baccalauréat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Section du Bac</label>
                <select
                  value={profile.bacSection}
                  onChange={e => setProfile({ ...profile, bacSection: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Mathématiques">Mathématiques</option>
                  <option value="Sciences Expérimentales">Sciences Expérimentales</option>
                  <option value="Sciences Techniques">Sciences Techniques</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Économie et Gestion">Économie et Gestion</option>
                  <option value="Lettres">Lettres</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Année d'obtention</label>
                <input
                  type="number"
                  value={profile.bacYear || 2026}
                  onChange={e => setProfile({ ...profile, bacYear: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Moyenne au Bac (/20)</label>
                <input
                  type="number"
                  step="0.01"
                  value={profile.bacAverage || ''}
                  onChange={e => setProfile({ ...profile, bacAverage: parseFloat(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  placeholder="ex: 15.42"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Aspirations & Projet Professionnel */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Centres d'Intérêt & Projet Professionnel
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Projet Professionnel Visé</label>
                <textarea
                  rows={3}
                  value={profile.careerGoals}
                  onChange={e => setProfile({ ...profile, careerGoals: e.target.value })}
                  placeholder="Décrivez votre ambition professionnelle, ce qui vous passionne et ce que vous souhaitez accomplir..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Complétude du profil : <strong>{profile.completenessPercentage}%</strong></span>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer mon Profil'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

