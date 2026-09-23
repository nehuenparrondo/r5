declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        role: 'user' | 'admin';
      };
    }
  }
}

export {};

// Este archivo amplía: Express.Request con datos autenticados.
// Se usa en: middlewares y controladores.
// Importa de: tipos globales de Express.
