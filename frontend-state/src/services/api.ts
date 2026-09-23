import type { ApiResponse, User } from '../types';

const API_URL = '/api';

const post = async <T = unknown>(path: string, body: unknown = {}): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(data.message ?? 'Error de comunicación con la API.');
  }

  return data;
};

export const authApi = {
  register: (payload: unknown) => post('/auth/register', payload),
  verifyEmail: (token: string) => post('/auth/verify-email', { token }),
  login: (payload: unknown) => post('/auth/login', payload),
  logout: () => post('/auth/logout'),
  me: () => post('/auth/me'),
  updateProfile: (payload: unknown) => post('/profile/update', payload),
  changePassword: (payload: unknown) => post('/profile/change-password', payload),
  listUsers: () => post<User[]>('/admin/users')
};

// Este archivo exporta: authApi basado en fetch.
// Se usa en: App.tsx y pantallas.
// Importa de: types.ts.
