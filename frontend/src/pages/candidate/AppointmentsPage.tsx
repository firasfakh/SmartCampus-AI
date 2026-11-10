import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types';
import { useToast } from '../../context/ToastContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface AppointmentsPageProps {
  onNavigate: (page: string) => void;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ onNavigate }) => {
  const { success, info } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Appointment Form
  const [formDate, setFormDate] = useState('2026-11-20');
  const [formTime, setFormTime] = useState('10:00 - 10:45');
  const [formModality, setFormModality] = useState<'in_person' | 'online_video'>('in_person');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      const apts = await appointmentService.getMyAppointments();
      setAppointments(apts);
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newApt = await appointmentService.scheduleAppointment({
      date: formDate,
      timeSlot: formTime,
      modality: formModality,
      notes: formNotes || "Entretien d'admission planifié par le candidat.",
    });
    setAppointments(prev => [newApt, ...prev]);
    setIsModalOpen(false);
    success("Rendez-vous planifié", `Votre créneau le ${formDate} à ${formTime} a été enregistré.`);
  };

  const handleCancel = async (id: string) => {
    await appointmentService.cancelAppointment(id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    info("Rendez-vous annulé", "Le créneau a été libéré avec succès.");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
              <Calendar className="w-4 h-4" />
              Planning des Entretiens d'Admission
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              Mes Rendez-vous d'Admission
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Échangez directement avec les jurys et directeurs de départements de l'IIT et de l'ISB.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Planifier un Rendez-vous</span>
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.map(apt => {
            const isConfirmed = apt.status === 'confirmed';
            const isCancelled = apt.status === 'cancelled';
            return (
              <div
                key={apt.id}
                className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCancelled ? 'opacity-60 border-slate-200' : isConfirmed ? 'border-purple-200 ring-1 ring-purple-100' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {apt.institution} &bull; {apt.programName}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isConfirmed ? 'bg-emerald-100 text-emerald-800' :
                      isCancelled ? 'bg-slate-100 text-slate-600' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {apt.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>{apt.date} &bull; {apt.timeSlot}</span>
                  </h3>

                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    {apt.modality === 'in_person' ? (
                      <>
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{apt.locationOrLink}</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 text-sky-600 shrink-0" />
                        <a href={apt.locationOrLink} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                          Lien Visioconférence Google Meet
                        </a>
                      </>
                    )}
                  </div>

                  {apt.notes && (
                    <p className="text-[11px] text-slate-500 italic pt-1">{apt.notes}</p>
                  )}
                </div>

                {!isCancelled && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('interview-prep')}
                      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-navy-900 font-semibold text-xs transition"
                    >
                      Conseils Entretien
                    </button>
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Annuler le rendez-vous"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Modal Schedule Appointment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-navy-900 mb-1">Planifier un Nouvel Entretien</h3>
            <p className="text-xs text-slate-500 mb-4">
              Choisissez la date et le créneau horaire souhaité avec le jury d'admission.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Créneau Horaire</label>
                <select
                  value={formTime}
                  onChange={e => setFormTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="09:00 - 09:45">09:00 - 09:45</option>
                  <option value="10:00 - 10:45">10:00 - 10:45</option>
                  <option value="11:15 - 12:00">11:15 - 12:00</option>
                  <option value="14:00 - 14:45">14:00 - 14:45</option>
                  <option value="15:00 - 15:45">15:00 - 15:45</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Modalité</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormModality('in_person')}
                    className={`p-2.5 rounded-lg border text-center font-medium ${
                      formModality === 'in_person' ? 'bg-navy-900 text-white border-navy-900' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Présentiel (Sfax)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormModality('online_video')}
                    className={`p-2.5 rounded-lg border text-center font-medium ${
                      formModality === 'online_video' ? 'bg-navy-900 text-white border-navy-900' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Visioconférence
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarques ou Besoins spécifiques</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Informations utiles pour la commission..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold"
                >
                  Confirmer le Rendez-vous
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

