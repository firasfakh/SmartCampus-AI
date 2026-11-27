// SA-28 — Gestion réelle des comptes et des rôles (administrateur).
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Power, RefreshCw, UserPlus } from 'lucide-react';
import { api, errorMessage } from '../../services/api';
import { BackendUser, passwordPolicyError } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ROLE_LABELS: Record<string, string> = {
  candidate: 'Candidat',
  responsable_academique: 'Responsable académique',
  responsable_entretien: 'Responsable entretiens',
  direction: 'Direction',
  admin: 'Administrateur',
};

const INTERNAL_ROLES = ['responsable_academique', 'responsable_entretien', 'direction', 'admin'];
const NEEDS_INSTITUTION = ['responsable_academique', 'responsable_entretien'];

export const UserManagementPanel: React.FC = () => {
  const { user: me } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', role: 'responsable_academique', institution: 'IIT' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api.get<BackendUser[]>('/auth/users'));
    } catch (e) {
      error('Chargement des comptes impossible', errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { void load(); }, [load]);

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < 12 || passwordPolicyError(form.password)) {
      error('Mot de passe refusé', 'Comptes internes : 12 caractères minimum, avec lettres et chiffres.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/users', {
        email: form.email,
        password: form.password,
        role: form.role,
        institution_code: NEEDS_INSTITUTION.includes(form.role) ? form.institution : null,
      });
      success('Compte créé', form.email);
      setForm(f => ({ ...f, email: '', password: '' }));
      await load();
    } catch (e) {
      error('Création impossible', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: BackendUser) => {
    try {
      await api.patch(`/auth/users/${u.id}/status`, { is_active: !u.is_active });
      await load();
    } catch (e) {
      error('Action impossible', errorMessage(e));
    }
  };

  const input = 'w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-sky-500';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Comptes et rôles (SA-28)</h3>
          <p className="text-xs text-slate-500">
            Les candidats s'inscrivent eux-mêmes. Les comptes internes sont créés ici ; un responsable est
            rattaché à un établissement (IIT ou ISB) qui limite son périmètre.
          </p>
        </div>
        <button onClick={() => void load()} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" title="Actualiser">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <form onSubmit={createAccount} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end text-xs">
        <label className="md:col-span-2 space-y-1">
          <span className="font-semibold text-slate-700">E-mail</span>
          <input type="email" required value={form.email} className={input}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="font-semibold text-slate-700">Mot de passe initial</span>
          <input type="password" required minLength={12} autoComplete="new-password" value={form.password} className={input}
            onChange={e => setForm({ ...form, password: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="font-semibold text-slate-700">Rôle</span>
          <select value={form.role} className={input} onChange={e => setForm({ ...form, role: e.target.value })}>
            {INTERNAL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          {NEEDS_INSTITUTION.includes(form.role) && (
            <select value={form.institution} className={input} aria-label="Établissement"
              onChange={e => setForm({ ...form, institution: e.target.value })}>
              <option value="IIT">IIT</option>
              <option value="ISB">ISB</option>
            </select>
          )}
          <button type="submit" disabled={saving}
            className="shrink-0 px-3 py-2 rounded-lg bg-navy-900 text-white font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Créer
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2 font-semibold">Compte</th>
                <th className="py-2 font-semibold">Rôle</th>
                <th className="py-2 font-semibold">Établissement</th>
                <th className="py-2 font-semibold">Statut</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="py-2">
                    <div className="font-semibold text-navy-900">{u.email}</div>
                    {(u.first_name || u.last_name) && <div className="text-slate-400">{u.first_name} {u.last_name}</div>}
                  </td>
                  <td className="py-2">{ROLE_LABELS[u.role] || u.role}</td>
                  <td className="py-2">{u.institution_code || '—'}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded font-semibold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.is_active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {u.id !== me?.id && (
                      <button onClick={() => void toggleActive(u)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600">
                        <Power className="w-3 h-3" /> {u.is_active ? 'Désactiver' : 'Réactiver'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-slate-400">Aucun compte.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
