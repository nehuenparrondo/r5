export const usernamePattern = /^[a-zA-Z0-9_.]{3,40}$/;
export const strongPasswordPattern = /^.{6,72}$/;

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();
export const normalizeUsername = (value: string): string => value.trim().toLowerCase();

// Este archivo exporta: reglas de validación reutilizables.
// Se usa en: formularios de registro y contraseña.
// Importa de: ninguna dependencia externa.
