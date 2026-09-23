export const normalizeEmail = (value: string): string => value.trim().toLowerCase();
export const normalizeUsername = (value: string): string => value.trim().toLowerCase();
export const normalizeDisplayName = (value: string): string => value.trim().replace(/\s+/g, ' ');

// Este archivo exporta: normalizadores de datos de usuario.
// Se usa en: validaciones, controladores y scripts.
// Importa de: ninguna dependencia externa.
