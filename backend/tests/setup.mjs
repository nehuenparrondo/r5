/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: aislar las pruebas de las credenciales y la base real.
 */
Object.assign(process.env, {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '9',
  DB_NAME: 'oauth_test_unused',
  DB_USER: 'test',
  DB_PASSWORD: 'test-not-real',
  JWT_SECRET: 'test-only-secret-never-use-in-production-0123456789',
  JWT_EXPIRES_IN: '15m',
  CORS_ORIGINS: 'http://localhost:5173,http://localhost:5174',
  APP_URL: 'http://localhost:5173',
  API_PUBLIC_URL: 'http://localhost:3000',
  GOOGLE_CLIENT_ID: 'test-google',
  GOOGLE_CLIENT_SECRET: 'test-google-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/auth/oauth/google/callback',
  GITHUB_CLIENT_ID: 'test-github',
  GITHUB_CLIENT_SECRET: 'test-github-secret',
  GITHUB_REDIRECT_URI: 'http://localhost:3000/api/auth/oauth/github/callback',
  FACEBOOK_CLIENT_ID: 'test-facebook',
  FACEBOOK_CLIENT_SECRET: 'test-facebook-secret',
  FACEBOOK_REDIRECT_URI: 'http://localhost:3000/api/auth/oauth/facebook/callback',
  MAILTRAP_USER: '',
  MAILTRAP_PASS: ''
});
// This file exports: entorno de pruebas.
// It is used by: pruebas backend.
// It imports from: process de Node.
