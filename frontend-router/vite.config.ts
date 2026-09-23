import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
  }
});

// Este archivo exporta: configuración de Vite.
// Se usa al ejecutar: npm run dev / npm run build.
// Importa de: vite y plugin React.
