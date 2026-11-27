import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { authService, LoginParams, RegisterParams } from '../services/authService';
import { chatService, VisitorUsage } from '../services/chatService';
import { AUTH_EXPIRED_EVENT } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** SA-29 : historique visiteur en attente de rattachement (null si rien à proposer). */
  pendingClaim: VisitorUsage | null;
  login: (params: LoginParams) => Promise<User>;
  register: (params: RegisterParams) => Promise<User>;
  logout: () => Promise<void>;
  /** Le candidat a répondu à la proposition de rattachement. */
  resolveClaim: (accepted: boolean) => Promise<number>;
  dismissClaim: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingClaim, setPendingClaim] = useState<VisitorUsage | null>(null);

  /** Après connexion d'un candidat : y a-t-il des conversations visiteur à rattacher ? */
  const checkVisitorHistory = useCallback(async (current: User) => {
    if (current.role !== 'candidate' || !chatService.hasVisitorToken()) return;
    try {
      const session = await chatService.getVisitorSession();
      if (session && session.usage.conversations > 0) setPendingClaim(session.usage);
    } catch {
      /* sans conséquence : la proposition sera simplement absente */
    }
  }, []);

  useEffect(() => {
    authService.getCurrentUser()
      .then(current => {
        setUser(current);
        if (current) void checkVisitorHistory(current);
      })
      .finally(() => setIsLoading(false));

    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [checkVisitorHistory]);

  const login = async (params: LoginParams) => {
    const loggedIn = await authService.login(params);
    setUser(loggedIn);
    await checkVisitorHistory(loggedIn);
    return loggedIn;
  };

  const register = async (params: RegisterParams) => {
    const registered = await authService.register(params);
    setUser(registered);
    await checkVisitorHistory(registered);
    return registered;
  };

  const logout = async () => {
    await authService.logout();
    setPendingClaim(null);
    setUser(null);
  };

  const resolveClaim = async (accepted: boolean) => {
    try {
      if (!accepted) {
        // Refus : l'historique reste anonyme et sera purgé à l'expiration de la session.
        chatService.forgetVisitorSession();
        return 0;
      }
      const result = await chatService.claimVisitorHistory(true);
      return result.transferred_conversations;
    } finally {
      setPendingClaim(null);
    }
  };

  const role: UserRole = user?.role || 'visitor';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        pendingClaim,
        login,
        register,
        logout,
        resolveClaim,
        dismissClaim: () => setPendingClaim(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
