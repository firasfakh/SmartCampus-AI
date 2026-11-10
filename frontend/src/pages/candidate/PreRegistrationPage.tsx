import React, { useState, useEffect } from 'react';
import { preRegistrationService } from '../../services/preRegistrationService';
import { PreRegistrationDossier, CandidateDocument } from '../../types';
import { useToast } from '../../context/ToastContext';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Building,
  GraduationCap
} from 'lucide-react';

interface PreRegistrationPageProps {
  onNavigate: (page: string) => void;
}

export const PreRegistrationPage: React.FC<PreRegistrationPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [dossier, setDossier] = useState<PreRegistrationDossier | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const d = await preRegistrationService.getDossier();
      setDossier(d);
      const docs = await preRegistrationService.getDocuments();
      setDocuments(docs);
    };
    load();
  }, []);

  const handleFileUpload = async (type: CandidateDocument['documentType'], e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error("Fichier trop volumineux", "La taille maximale autorisée est de 10 Mo.");
      return;
    }

    setIsUploading(type);
    try {
      const newDoc = await preRegistrationService.uploadDocument(type, file);
      setDocuments(prev => [...prev.filter(d => d.documentType !== type), newDoc]);
      success("Document téléversé", `Le document ${file.name} a été enregistré.`);
    } catch {
      error("Erreur de téléversement", "Impossible d'enregistrer le document sur le serveur.");
    } finally {
      setIsUploading(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updated = await preRegistrationService.submitDossier();
      setDossier(updated);
      success("Dossier soumis avec succès !", "Votre candidature est désormais en cours d'instruction par la commission d'admission.");
    } catch {
      error("Erreur", "Impossible de soumettre le dossier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!dossier) return null;

  const DOCUMENT_SLOTS: { type: CandidateDocument['documentType']; label: string; required: boolean }[] = [
    { type: 'cin', label: "Carte d'Identité Nationale (CIN ou Passeport)", required: true },
    { type: 'bac_transcript', label: "Relevé de Notes Officiel du Baccalauréat", required: true },
    { type: 'bac_diploma', label: "Diplôme / Attestation de Réussite du Bac", required: true },
    { type: 'cv', label: "Curriculum Vitae (CV) Récent", required: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">
              <FileText className="w-4 h-4" />
              Dossier Administratif Numérique
            </div>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
              Préinscription Universitaire 2026-2027
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Dossier N° <strong>{dossier.id}</strong> &bull; Candidat : {dossier.candidateName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              dossier.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
              dossier.status === 'submitted' ? 'bg-sky-100 text-sky-800' :
              dossier.status === 'under_review' ? 'bg-purple-100 text-purple-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              Statut : {dossier.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Selected Program Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
              {dossier.institution} &bull; Vœu Principal
            </span>
            <h3 className="text-base font-bold text-navy-900">{dossier.programName}</h3>
            <p className="text-xs text-slate-500">Campus de Sfax &bull; Année Universitaire 2026-2027</p>
          </div>
          <button
            onClick={() => onNavigate('programs')}
            className="text-xs font-semibold text-slate-600 hover:text-navy-900 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition shrink-0"
          >
            Changer de filière
          </button>
        </div>

        {/* Document Uploads Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-navy-900">Pièces Justificatives Obligatoires</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Formats acceptés : PDF, JPG, PNG (Taille maximale : 10 Mo par document).
            </p>
          </div>

          <div className="space-y-4">
            {DOCUMENT_SLOTS.map(slot => {
              const uploadedDoc = documents.find(d => d.documentType === slot.type);
              const isLoadingThis = isUploading === slot.type;

              return (
                <div
                  key={slot.type}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy-900">{slot.label}</span>
                      {slot.required && (
                        <span className="text-[10px] text-red-500 font-semibold">*Requis</span>
                      )}
                    </div>
                    {uploadedDoc ? (
                      <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Fichier déposé : {uploadedDoc.fileName} ({(uploadedDoc.fileSize / 1024 / 1024).toFixed(2)} Mo)</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">Aucun document téléversé pour le moment.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                      uploadedDoc 
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                        : 'bg-navy-900 text-white hover:bg-navy-800'
                    }`}>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isLoadingThis ? 'Envoi...' : uploadedDoc ? 'Remplacer' : 'Téléverser'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(slot.type, e)}
                        className="hidden"
                        disabled={isLoadingThis}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission Confirmation Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-navy-900">Soumission Officielle du Dossier</h4>
            <p className="text-xs text-slate-500">
              En soumettant votre dossier, vous certifiez l'exactitude des informations fournies.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || dossier.status === 'submitted'}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Traitement...' : dossier.status === 'submitted' ? 'Dossier Déjà Déposé' : 'Soumettre ma Candidature'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

