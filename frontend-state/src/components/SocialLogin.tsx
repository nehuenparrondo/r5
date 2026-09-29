/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: mostrar botones sociales con redirecciones de pagina.
 */
import { useEffect, useState } from 'react';
import { oauthApi, type SocialProvider } from '../services/oauth';
import { StatusMessage } from './StatusMessage';

// Iconos locales que conservan colores de marca sin peticiones externas.
export const ProviderIcon = ({ provider }: { provider: string }) => {
  if (provider === 'google')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
        />
        <path
          fill="#FBBC05"
          d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.06a10 10 0 0 0 0 9.04l3.35-2.59Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.35 2.59C7.2 7.71 9.4 5.95 12 5.95Z"
        />
      </svg>
    );
  if (provider === 'github')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.71 2.63 1.22 3.27.93.1-.73.39-1.22.72-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.63 0c2.15-1.45 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.15 5.55.41.35.77 1.03.77 2.08v3.11c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
      </svg>
    );
  if (provider === 'discord')
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="#5865F2">
        <path d="M19.5 5.34A17.3 17.3 0 0 0 15.36 4l-.52 1.06a16 16 0 0 0-5.68 0L8.64 4A17.4 17.4 0 0 0 4.5 5.34C1.88 9.22 1.17 13 1.53 16.72A16.7 16.7 0 0 0 6.6 19.3l1.22-1.67c-.67-.25-1.31-.57-1.92-.95l.47-.36c3.7 1.72 7.72 1.72 11.38 0l.48.36c-.62.38-1.26.7-1.93.95l1.22 1.67a16.6 16.6 0 0 0 5.07-2.58c.43-4.31-.74-8.06-3.09-11.38ZM8.67 14.43c-1.11 0-2.03-1.03-2.03-2.3s.9-2.3 2.03-2.3c1.14 0 2.05 1.04 2.03 2.3 0 1.27-.9 2.3-2.03 2.3Zm6.66 0c-1.12 0-2.03-1.03-2.03-2.3s.9-2.3 2.03-2.3c1.14 0 2.05 1.04 2.03 2.3 0 1.27-.89 2.3-2.03 2.3Z" />
      </svg>
    );
  return <span aria-hidden="true">↗</span>;
};

export const SocialLogin = ({ linking = false }: { linking?: boolean }) => {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void oauthApi
      .providers()
      .then((data) => {
        if (active) setProviders(data.providers);
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los proveedores sociales.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const start = async (provider: string) => {
    setBusy(true);
    setError('');
    if (!linking) {
      oauthApi.start(provider);
      return;
    }
    try {
      const result = await oauthApi.link(provider);
      window.location.assign(result.url);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo vincular la cuenta.');
      setBusy(false);
    }
  };
  return (
    <div className="social-login">
      {!linking && (
        <div className="auth-divider">
          <span>o continuar con</span>
        </div>
      )}
      {loading && (
        <p className="muted" role="status">
          Cargando opciones de acceso...
        </p>
      )}
      <div
        className="social-buttons"
        aria-label={linking ? 'Vincular cuenta social' : 'Acceso social'}
      >
        {providers.map((provider) => (
          <button
            type="button"
            className="social-button"
            key={provider.id}
            disabled={!provider.enabled || busy}
            onClick={() => void start(provider.id)}
            title={provider.enabled ? undefined : 'Pendiente de configurar en el servidor'}
          >
            <span className="social-icon">
              <ProviderIcon provider={provider.id} />
            </span>
            <span>
              {linking ? 'Vincular' : 'Continuar con'} {provider.label}
            </span>
            {!provider.enabled && <small>Sin configurar</small>}
          </button>
        ))}
      </div>
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
    </div>
  );
};
// This file exports: SocialLogin y ProviderIcon.
// It is used by: login, registro y LinkedAccounts.
// It imports from: React, oauthApi y StatusMessage.
