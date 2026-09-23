import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { StatusMessage } from '../components/StatusMessage';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

type FormData = { login: string; password: string };

export const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>();

  const onSubmit = handleSubmit(async (data) => {
    setServerError('');

    try {
      await authApi.login({ login: data.login.trim().toLowerCase(), password: data.password });
      await refreshUser();
      navigate('/perfil');
    } catch (error: any) {
      setServerError(error?.response?.data?.message ?? 'No se pudo iniciar sesión.');
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

      <form className="card grid auth-card" onSubmit={onSubmit} noValidate>
        <div className="auth-card__heading">
          <span className="auth-card__icon" aria-hidden="true">→</span>
          <div>
            <p className="eyebrow">BIENVENIDO</p>
            <h2>Iniciar sesión</h2>
          </div>
        </div>

        <TextField
          label="Email o username"
          autoComplete="username"
          placeholder="tu@email.com"
          registration={register('login', { required: 'Ingresá tu email o username.' })}
          error={errors.login}
        />

        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          registration={register('password', { required: 'Ingresá tu contraseña.' })}
          error={errors.password}
        />

        {serverError && <StatusMessage kind="error">{serverError}</StatusMessage>}

        <button className="primary-action" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className="auth-divider"><span>o</span></div>
        <Link className="button-link secondary-action" to="/registro">
          ¿No tenés una cuenta? Crear una
        </Link>
      </form>
    </section>
  );
};

// Este archivo exporta: LoginPage.
// Se usa en: App.tsx.
// Importa de: react-hook-form, React Router, AuthContext, API y componentes.
