/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: consultar y vincular cuentas desde el perfil autenticado.
 */
import { useEffect, useState } from 'react';
import { oauthApi, type LinkedAccount } from '../services/oauth';
import { ProviderIcon } from './SocialLogin';
import { OAuthFeedback } from './OAuthFeedback';
import { StatusMessage } from './StatusMessage';

const labels: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  discord: 'Discord'
};
export const LinkedAccounts = ({
  provider,
  emailVerified
}: {
  provider?: string | null;
  emailVerified?: boolean;
}) => {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void oauthApi
      .accounts()
      .then((data) => {
        if (active) setAccounts(data.accounts);
      })
      .catch(() => {
        if (active)
          setError('No se pudieron cargar las cuentas vinculadas. Revisá la migración OAuth.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="card grid">
      <h2>Cuentas vinculadas</h2>
      <p className="muted">
        Ingresaste con {provider ? (labels[provider] ?? provider) : 'email y contraseña'}.
      </p>
      <OAuthFeedback />
      {emailVerified === false && (
        <StatusMessage kind="info">
          Tu email está pendiente de verificación. Revisá el correo antes de vincular otra cuenta.
        </StatusMessage>
      )}
      {loading && <p role="status">Cargando cuentas...</p>}
      {!loading && !error && accounts.length === 0 && (
        <p className="muted">Todavía no vinculaste cuentas sociales.</p>
      )}
      {accounts.length > 0 && (
        <ul className="linked-accounts">
          {accounts.map((account) => (
            <li key={account.id}>
              <span className="social-icon">
                <ProviderIcon provider={account.provider} />
              </span>
              <span>
                <strong>{labels[account.provider] ?? account.provider}</strong>
                <small>{account.email ?? 'Email no compartido'}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
    </section>
  );
};
// This file exports: LinkedAccounts.
// It is used by: ProfilePage y ProfileScreen.
// It imports from: React, oauthApi y componentes sociales.
