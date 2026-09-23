import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusMessage } from '../components/StatusMessage';
import { authApi } from '../services/api';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Estamos verificando tu email...');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('El enlace de verificación no es válido.');
      return;
    }

    void authApi.verifyEmail(token)
      .then((response) => {
        setStatus('success');
        setMessage(response.data.message ?? 'Email verificado correctamente.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error?.response?.data?.message ?? 'No se pudo verificar el email.');
      });
  }, [searchParams]);

  return (
    <section className="card grid auth-card verification-card">
      <div className={`verification-icon verification-icon--${status}`} aria-hidden="true">
        {status === 'loading' ? '…' : status === 'success' ? '✓' : '!'}
      </div>
      <div className="verification-copy">
        <p className="eyebrow">VERIFICACIÓN DE EMAIL</p>
        <h2>{status === 'loading' ? 'Un momento' : status === 'success' ? '¡Cuenta verificada!' : 'No pudimos verificarla'}</h2>
      </div>
      <StatusMessage kind={status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'}>
        {message}
      </StatusMessage>
      {status !== 'loading' && <Link className="button-link primary-action" to="/login">Ir al login</Link>}
    </section>
  );
};
