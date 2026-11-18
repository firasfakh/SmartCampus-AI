import React from 'react';
import { GraduationCap, ShieldCheck, Mail, Phone, MapPin, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Presentation */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base">SmartCampus AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plateforme agentique d’orientation universitaire et d’admission personnalisée pour l’Institut International de Technologie (IIT) et l’International School of Business (ISB).
            </p>
            <div className="flex items-center gap-2 pt-2 text-[11px] text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Accréditation EUR-ACE & Homologation Officielle</span>
            </div>
          </div>

          {/* Col 2: Formations IIT */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Pôle Ingénierie (IIT)
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Cycle Ingénieur Génie Informatique (IA & Cloud)</li>
              <li>Cycle Ingénieur Génie Civil & BIM</li>
              <li>Cycle Ingénieur Génie Industriel & Logistique</li>
              <li>Cycle Préparatoire Intégré aux Études d’Ingénieur</li>
              <li>Licence en Sciences de l’Informatique</li>
            </ul>
          </div>

          {/* Col 3: Formations ISB */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              Pôle Management (ISB)
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Master Business Analytics & Big Data</li>
              <li>Master Finance Internationale & M&A</li>
              <li>Licence Finance & FinTech</li>
              <li>Licence Management & Stratégie d’Entreprise</li>
              <li>Licence Marketing Digital & E-Commerce</li>
            </ul>
          </div>

          {/* Col 4: Campus & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Campus de Sfax</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Route Menzel Chaker Km 0.5, Sfax 3000, Tunisie</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>+216 74 465 020 / +216 29 911 911</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>contact@iit.ens.tn &bull; contact@isb.ens.tn</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-navy-800 text-[11px] text-slate-500">
              Équipe FYKEK — Groupe 3 &bull; Sujet IA Générative
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} SmartCampus AI — IIT & ISB Sfax. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Conditions d'admission</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400 cursor-pointer">Règlement des études</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400 cursor-pointer">Protection des données</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

