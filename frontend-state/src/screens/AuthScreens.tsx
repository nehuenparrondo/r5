import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StatusMessage } from '../components/StatusMessage';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { SocialLogin } from '../components/SocialLogin';
import { OAuthFeedback } from '../components/OAuthFeedback';
import {
  normalizeEmail,
  normalizeUsername,
  strongPasswordPattern,
  usernamePattern
} from '../utils/validators';

export const LoginScreen = ({
  onDone,
  onRegister
}: {
  onDone: () => void;
  onRegister: () => void;
}) => {
  const { setUser } = useAuth();
  const [error, setError] = useState('');
  const form = useForm<{ login: string; password: string }>();

  const submit = form.handleSubmit(async (data) => {
    setError('');
    try {
      const response = await authApi.login({
        login: data.login.trim().toLowerCase(),
        password: data.password
      });
      setUser(response.user ?? null);
      onDone();
    } catch (requestError: any) {
      setError(requestError.message ?? 'No se pudo iniciar sesión.');
    }
  });

  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <span className="auth-kicker">ACCESO SEGURO</span>
        <h1>Tu espacio, simple y protegido.</h1>
        <p>Administrá tu perfil y tus datos desde una experiencia clara, rápida y segura.</p>
        <div className="auth-decoration" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <form className="card grid auth-card" onSubmit={submit} noValidate>
        <div className="auth-card__heading">
          <span className="auth-card__icon" aria-hidden="true">
            →
          </span>
          <div>
            <p className="eyebrow">BIENVENIDO</p>
            <h2>Iniciar sesión</h2>
          </div>
        </div>
        <TextField
          label="Email o username"
          autoComplete="username"
          placeholder="tu@email.com"
          registration={form.register('login', { required: 'Ingresá tu email o username.' })}
          error={form.formState.errors.login}
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          registration={form.register('password', { required: 'Ingresá tu contraseña.' })}
          error={form.formState.errors.password}
        />
        <OAuthFeedback />
        {error && <StatusMessage kind="error">{error}</StatusMessage>}
        <button className="primary-action" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>
        <SocialLogin />
        <div className="auth-divider">
          <span>o</span>
        </div>
        <button className="secondary-action" type="button" onClick={onRegister}>
          ¿No tenés una cuenta? Crear una
        </button>
      </form>
    </section>
  );
};

export const RegisterScreen = ({ onBack }: { onBack: () => void }) => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const form = useForm<{
    email: string;
    username: string;
    displayName: string;
    password: string;
    confirmPassword: string;
  }>({ mode: 'onChange' });

  const submit = form.handleSubmit(async (data) => {
    setError('');
    setStatus('');
    try {
      await authApi.register({
        ...data,
        email: normalizeEmail(data.email),
        username: normalizeUsername(data.username),
        displayName: data.displayName.trim()
      });
      setStatus('Cuenta creada. Revisá Mailtrap y abrí el enlace para verificar tu email.');
    } catch (requestError: any) {
      setError(requestError.message ?? 'No se pudo registrar.');
    }
  });

  return (
    <form className="card grid auth-card register-card" onSubmit={submit} noValidate>
      <div className="auth-card__heading">
        <button className="back-button" type="button" onClick={onBack} aria-label="Volver al login">
          ←
        </button>
        <div>
          <p className="eyebrow">NUEVA CUENTA</p>
          <h2>Crear cuenta</h2>
        </div>
      </div>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        registration={form.register('email', {
          required: 'Email obligatorio.',
          validate: (value) => /^\S+@\S+\.\S+$/.test(value.trim()) || 'Email inválido.'
        })}
        error={form.formState.errors.email}
      />
      <TextField
        label="Username"
        autoComplete="username"
        registration={form.register('username', {
          required: 'Username obligatorio.',
          validate: (value) => usernamePattern.test(value.trim()) || 'Usá letras, números, _ o .'
        })}
        error={form.formState.errors.username}
      />
      <TextField
        label="Nombre visible"
        registration={form.register('displayName', {
          required: 'Nombre obligatorio.',
          minLength: { value: 2, message: 'Mínimo 2 caracteres.' }
        })}
        error={form.formState.errors.displayName}
      />
      <div className="grid grid--2">
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          registration={form.register('password', {
            required: 'Contraseña obligatoria.',
            validate: (value) =>
              strongPasswordPattern.test(value) ||
              'La contraseña debe tener entre 6 y 72 caracteres.'
          })}
          error={form.formState.errors.password}
        />
        <TextField
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          registration={form.register('confirmPassword', {
            required: 'Confirmación obligatoria.',
            validate: (value) => value === form.watch('password') || 'Las contraseñas no coinciden.'
          })}
          error={form.formState.errors.confirmPassword}
        />
      </div>
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
      {status && <StatusMessage kind="success">{status}</StatusMessage>}
      <button disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Registrando...' : 'Registrarme'}
      </button>
      <SocialLogin />
      <p className="muted auth-footnote">
        ¿Ya tenés cuenta?{' '}
        <button className="text-button" type="button" onClick={onBack}>
          Ingresar
        </button>
      </p>
    </form>
  );
};

export const VerifyEmailScreen = ({ token, onDone }: { token: string; onDone: () => void }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Estamos verificando tu email...');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setStatus('error');
      setMessage('El enlace de verificación no es válido.');
      return;
    }
    void authApi
      .verifyEmail(token)
      .then((response) => {
        setStatus('success');
        setMessage(response.message ?? 'Email verificado correctamente.');
      })
      .catch((requestError) => {
        setStatus('error');
        setMessage(requestError.message ?? 'No se pudo verificar el email.');
      });
  }, [token]);

  return (
    <section className="card grid auth-card verification-card">
      <div className={`verification-icon verification-icon--${status}`} aria-hidden="true">
        {status === 'loading' ? '…' : status === 'success' ? '✓' : '!'}
      </div>
      <div className="verification-copy">
        <p className="eyebrow">VERIFICACIÓN DE EMAIL</p>
        <h2>
          {status === 'loading'
            ? 'Un momento'
            : status === 'success'
              ? '¡Cuenta verificada!'
              : 'No pudimos verificarla'}
        </h2>
      </div>
      <StatusMessage
        kind={status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'}
      >
        {message}
      </StatusMessage>
      {status !== 'loading' && (
        <button className="primary-action" type="button" onClick={onDone}>
          Ir al login
        </button>
      )}
    </section>
  );
};
