import axios from 'axios';
import type { ApiResponse, User } from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export const authApi = {
  register: (payload: unknown) => api.post<ApiResponse>('/auth/register', payload),
  verifyEmail: (token: string) => api.post<ApiResponse>('/auth/verify-email', { token }),
  login: (payload: unknown) => api.post<ApiResponse>('/auth/login', payload),
  logout: () => api.post<ApiResponse>('/auth/logout', {}),
  me: () => api.post<ApiResponse>('/auth/me', {}),
  updateProfile: (payload: unknown) => api.post<ApiResponse>('/profile/update', payload),
  changePassword: (payload: unknown) => api.post<ApiResponse>('/profile/change-password', payload),
  listUsers: () => api.post<ApiResponse<User[]>>('/admin/users', {})
};

// Este archivo exporta: authApi basado en Axios.
// Se usa en: AuthContext y páginas.
// Importa de: axios y types.ts.
