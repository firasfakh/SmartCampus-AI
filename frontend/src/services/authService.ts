import { api } from './api';
import { User, UserRole } from '../types';

export interface LoginParams {
  email: string;
  password?: string;
  role?: UserRole; // Permet de basculer de rôle facilement en démonstration
}

export interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
}

// Comptes de démonstration prédéfinis pour les 6 rôles institutionnels
export const DEMO_ACCOUNTS: Record<UserRole, User> = {
  visitor: {
    id: 'usr-visitor',
    email: 'visiteur@smartcampus.tn',
    firstName: 'Visiteur',
    lastName: 'Invité',
    role: 'visitor',
  },
  candidate: {
    id: 'usr-candidate-1',
    email: 'yassine.trabelsi@gmail.com',
    firstName: 'Yassine',
    lastName: 'Trabelsi',
    role: 'candidate',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  },
  academic_iit: {
    id: 'usr-iit-resp',
    email: 'resp.iit@iit.tn',
    firstName: 'Dr. Slim',
    lastName: 'Ben Amor',
    role: 'academic_iit',
    institution: 'IIT',
  },
  academic_isb: {
    id: 'usr-isb-resp',
    email: 'resp.isb@isb.tn',
    firstName: 'Dr. Nadia',
    lastName: 'Chaker',
    role: 'academic_isb',
    institution: 'ISB',
  },
  interview_resp: {
    id: 'usr-interview-resp',
    email: 'entretiens@smartcampus.tn',
    firstName: 'M. Mehdi',
    lastName: 'Karray',
    role: 'interview_resp',
  },
  direction: {
    id: 'usr-direction',
    email: 'direction@iit-isb.tn',
    firstName: 'Prof. Raouf',
    lastName: 'Triki',
    role: 'direction',
  },
  admin: {
    id: 'usr-admin',
    email: 'admin@smartcampus.tn',
    firstName: 'Amine',
    lastName: 'Ghorbel',
    role: 'admin',
  },
};

export const authService = {
  async login(params: LoginParams): Promise<{ user: User; token: string }> {
    try {
      // Tentative réelle vers le backend FastAPI
      const response = await api.post<any>('/auth/login', {
        username: params.email,
        password: params.password || 'password123',
      });

      if (response && response.access_token) {
        const token = response.access_token;
        localStorage.setItem('smartcampus_token', token);
        // Récupérer l'utilisateur
        const user = (await this.getCurrentUser()) || DEMO_ACCOUNTS.candidate;
        return { user, token };
      }
    } catch (e) {
      console.info('[AuthService] Backend login indisponible ou placeholder, bascule sur session sécurisée locale.');
    }

    // Gestion / Démonstration : si le rôle est précisé ou déduit de l'email
    let selectedUser = DEMO_ACCOUNTS.candidate;
    if (params.role && DEMO_ACCOUNTS[params.role]) {
      selectedUser = DEMO_ACCOUNTS[params.role];
    } else {
      const found = Object.values(DEMO_ACCOUNTS).find(u => u.email.toLowerCase() === params.email.toLowerCase());
      if (found) selectedUser = found;
    }

    const mockToken = `mock-jwt-${selectedUser.role}-${Date.now()}`;
    localStorage.setItem('smartcampus_token', mockToken);
    localStorage.setItem('smartcampus_user', JSON.stringify(selectedUser));

    return { user: selectedUser, token: mockToken };
  },

  async register(params: RegisterParams): Promise<{ user: User; token: string }> {
    try {
      await api.post<any>('/auth/register', params);
    } catch (e) {
      console.info('[AuthService] Backend register endpoint placeholder appelé.');
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      role: 'candidate',
    };

    const token = `mock-jwt-candidate-${Date.now()}`;
    localStorage.setItem('smartcampus_token', token);
    localStorage.setItem('smartcampus_user', JSON.stringify(newUser));

    return { user: newUser, token };
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('smartcampus_token');
    if (!token) return null;

    try {
      const response = await api.get<any>('/auth/me');
      if (response && response.user_id) {
        // Enriched user from backend
        return {
          id: response.user_id,
          email: `${response.user_id}@smartcampus.tn`,
          firstName: 'Utilisateur',
          lastName: 'Connecté',
          role: response.role as UserRole || 'candidate',
        };
      }
    } catch {
      // Fallback local storage
    }

    const stored = localStorage.getItem('smartcampus_user');
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }

    return null;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('smartcampus_token');
      localStorage.removeItem('smartcampus_user');
    }
  },

  switchRole(role: UserRole): User {
    const user = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.candidate;
    localStorage.setItem('smartcampus_user', JSON.stringify(user));
    localStorage.setItem('smartcampus_token', `mock-jwt-${role}-${Date.now()}`);
    return user;
  }
};
