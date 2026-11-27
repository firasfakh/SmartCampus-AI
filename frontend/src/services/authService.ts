// SmartCampus AI — Authentification (SA-28).
import { api, STORAGE_KEYS, storageGet, storageSet } from './api';
import { Institution, User, UserRole } from '../types';

export interface LoginParams { email: string; password: string; }
export interface RegisterParams {
  firstName: string; lastName: string; email: string; phone: string; password: string;
}

export type BackendRole =
  | 'candidate' | 'responsable_academique' | 'responsable_entretien' | 'direction' | 'admin';

export interface BackendUser {
  id?: string; user_id?: string; email: string; role: BackendRole;
  first_name?: string; last_name?: string; phone?: string | null;
  is_active?: boolean; institution_code?: Institution | null; created_at?: string;
}

/** Rôle backend (+ établissement pour un responsable académique) -> rôle de l'interface. */
export function mapRole(role: BackendRole, institution?: Institution | null): UserRole {
  switch (role) {
    case 'candidate': return 'candidate';
    case 'responsable_academique': return institution === 'ISB' ? 'academic_isb' : 'academic_iit';
    case 'responsable_entretien': return 'interview_resp';
    case 'direction': return 'direction';
    case 'admin': return 'admin';
    default: return 'visitor';
  }
}

export function mapUser(raw: BackendUser): User {
  return {
    id: raw.id || raw.user_id || '',
    email: raw.email,
    firstName: raw.first_name || '',
    lastName: raw.last_name || '',
    role: mapRole(raw.role, raw.institution_code),
    backendRole: raw.role,
    institution: raw.institution_code || undefined,
  };
}

type TokenResponse = { access_token: string; token_type: string; user: BackendUser };

export const authService = {
  hasToken(): boolean {
    return !!storageGet(STORAGE_KEYS.token);
  },

  async login(params: LoginParams): Promise<User> {
    const response = await api.post<TokenResponse>('/auth/login', {
      username: params.email.trim(),
      password: params.password,
    });
    storageSet(STORAGE_KEYS.token, response.access_token);
    return mapUser(response.user);
  },

  async register(params: RegisterParams): Promise<User> {
    const response = await api.post<TokenResponse>('/auth/register', {
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      email: params.email.trim(),
      phone: params.phone.trim() || null,
      password: params.password,
    });
    storageSet(STORAGE_KEYS.token, response.access_token);
    return mapUser(response.user);
  },

  async getCurrentUser(): Promise<User | null> {
    if (!this.hasToken()) return null;
    try {
      return mapUser(await api.get<BackendUser>('/auth/me'));
    } catch {
      storageSet(STORAGE_KEYS.token, null);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      if (this.hasToken()) await api.post('/auth/logout');
    } catch {
      /* le token est supprimé dans tous les cas */
    } finally {
      storageSet(STORAGE_KEYS.token, null);
    }
  },
};

/** Règle identique à celle du backend (app/core/security.py). */
export function passwordPolicyError(password: string): string | null {
  if (password.length < 8) return 'Au moins 8 caractères.';
  if (new TextEncoder().encode(password).length > 72) return '72 octets maximum.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Au moins une lettre et un chiffre.';
  return null;
}
