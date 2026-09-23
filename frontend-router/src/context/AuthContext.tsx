import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../services/api';
import type { User } from '../types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authApi.me();
      setUser(response.data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  const value = useMemo(() => ({ user, loading, refreshUser, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
};

// Este archivo exporta: AuthProvider y useAuth.
// Se usa en: main.tsx, rutas protegidas y páginas.
// Importa de: React, services/api.ts y types.ts.
