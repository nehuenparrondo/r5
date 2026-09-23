import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusMessage } from './StatusMessage';

type Props = {
  children: ReactElement;
  adminOnly?: boolean;
};

export const ProtectedRoute = ({ children, adminOnly = false }: Props) => {
  const { user, loading } = useAuth();

  if (loading) return <StatusMessage kind="info">Verificando sesión...</StatusMessage>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/perfil" replace />;

  return children;
};

// Este archivo exporta: ProtectedRoute.
// Se usa en: App.tsx.
// Importa de: React Router, AuthContext y StatusMessage.
