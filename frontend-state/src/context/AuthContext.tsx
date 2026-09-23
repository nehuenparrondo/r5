import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../types';

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
};

// Este archivo exporta: AuthProvider y useAuth.
// Se usa en: main.tsx y App.tsx.
// Importa de: React y types.ts.
