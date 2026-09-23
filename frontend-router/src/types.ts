export type Role = 'user' | 'admin';

export type User = {
  id: number;
  email: string;
  username: string;
  role: Role;
  displayName: string;
  bio: string;
  emailVerified?: boolean;
};

export type ApiResponse<T = unknown> = {
  ok: boolean;
  message?: string;
  user?: User;
  users?: T;
  errors?: Record<string, string[]>;
};

// Este archivo exporta: tipos compartidos del front-end.
// Se usa en: contextos, servicios, páginas y componentes.
// Importa de: ninguna dependencia externa.
