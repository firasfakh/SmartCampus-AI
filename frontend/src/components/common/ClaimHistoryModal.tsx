// SA-29 — Proposition de rattachement de l'historique visiteur, avec consentement explicite.
import React, { useState } from 'react';
import { History, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../services/api';

export const ClaimHistoryModal: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const { pendingClaim, resolveClaim, dismissClaim } = useAuth();
  const { success, error } = useToast();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!pendingClaim) return null;
  const n = pendingClaim.conversations;

  const answer = async (accepted: boolean) => {
    setBusy(true);
    try {
      const transferred = await resolveClaim(accepted);
      if (accepted) {
        success('Historique rattaché', `${transferred} conversation(s) ajoutée(s) à votre compte.`);
      }
      onDone?.();
    } catch (e) {
      error('Rattachement impossible', errorMessage(e));
    } finally {
      setBusy(false);
      setConsent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="claim-title">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h2 id="claim-title" className="text-base font-bold text-navy-900">
              Conserver votre historique ?
            </h2>
          </div>
          <button onClick={dismissClaim} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Décider plus tard">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Avant de vous connecter, vous avez échangé avec l'assistant en tant que visiteur
          ({n} conversation{n > 1 ? 's' : ''}, {pendingClaim.user_messages} message{pendingClaim.user_messages > 1 ? 's' : ''}).
          Vous pouvez les rattacher à votre compte pour retrouver cet historique et permettre à
          l'assistant de s'en souvenir.
        </p>

        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
          <span>
            J'accepte que ces conversations soient associées à mon compte candidat et consultées par
            les services d'admission dans le cadre de mon orientation.
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={() => answer(false)}
            disabled={busy}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Ne pas rattacher
          </button>
          <button
            onClick={() => answer(true)}
            disabled={!consent || busy}
            className="px-4 py-2 rounded-lg bg-navy-900 text-white text-xs font-bold hover:bg-navy-800 disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            {busy ? 'Rattachement…' : 'Rattacher à mon compte'}
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          Sans rattachement, l'historique visiteur est supprimé automatiquement à l'expiration de la session.
        </p>
      </div>
    </div>
  );
};
