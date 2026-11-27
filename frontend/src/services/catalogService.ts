// SmartCampus AI — Catalogue académique (SA-20 / SA-21).
import { useEffect, useState } from 'react';
import { api } from './api';
import { OFFICIAL_PROGRAMS } from '../data/officialPrograms';
import { Institution, Program } from '../types';

export interface ApiProgram {
  id: number;
  institution_code: Institution;
  institution_name: string;
  program_code: string;
  program_name: string;
  program_type: string;
  program_domain: string | null;
  program_duration: string | null;
  program_description: string | null;
  tuition: { amount: string | null; currency: string | null } | null;
}

const LEVELS: Record<string, Program['level']> = {
  Master: 'Master',
  Licence: 'Licence',
  'Cycle ingénieur': 'Ingénieur',
  'Cycle préparatoire': 'Licence',
};

/** Les données de l'API priment ; le fichier local complète les champs d'affichage absents de l'API. */
function toProgram(p: ApiProgram): Program {
  const local = OFFICIAL_PROGRAMS.find(o => o.code === p.program_code);
  const description = (p.program_description || local?.description || '').split('\nPoints forts')[0];
  return {
    id: local?.id || p.program_code.toLowerCase(),
    name: p.program_name,
    shortName: local?.shortName || p.program_name,
    code: p.program_code,
    institution: p.institution_code,
    level: LEVELS[p.program_type] || local?.level || 'Licence',
    duration: p.program_duration || local?.duration || '',
    description,
    prerequisites: local?.prerequisites || [],
    careerOpportunities: local?.careerOpportunities || [],
    curriculumHighlights: local?.curriculumHighlights || [],
    tuitionPerYearTND: p.tuition?.amount ? Number(p.tuition.amount) : local?.tuitionPerYearTND || 0,
    featured: local?.featured,
  };
}

export type CatalogSource = 'loading' | 'api' | 'offline';

/** Formations depuis l'API ; repli sur les données locales si le backend est indisponible ou vide. */
export function useCatalogPrograms(): { programs: Program[]; source: CatalogSource } {
  const [programs, setPrograms] = useState<Program[]>(OFFICIAL_PROGRAMS);
  const [source, setSource] = useState<CatalogSource>('loading');

  useEffect(() => {
    let cancelled = false;
    api.get<ApiProgram[]>('/catalog/programs')
      .then(rows => {
        if (cancelled) return;
        if (rows.length === 0) {
          setSource('offline');
          return;
        }
        setPrograms(rows.map(toProgram));
        setSource('api');
      })
      .catch(() => !cancelled && setSource('offline'));
    return () => { cancelled = true; };
  }, []);

  return { programs, source };
}
