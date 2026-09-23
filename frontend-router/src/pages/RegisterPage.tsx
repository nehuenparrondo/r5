import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { StatusMessage } from '../components/StatusMessage';
import { TextField } from '../components/TextField';
import { authApi } from '../services/api';
import { normalizeEmail, normalizeUsername, strongPasswordPattern, usernamePattern } from '../utils/validators';

type FormData = {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ mode: 'onChange' });

  const password = watch('password');

  const onSubmit = handleSubmit(async (data) => {
    setServerError('');
    setStatus('');

    try {
      await authApi.register({
        ...data,
        email: normalizeEmail(data.email),
        username: normalizeUsername(data.username),
        displayName: data.displayName.trim()
      });
      setStatus('Cuenta creada. Revisá Mailtrap y abrí el enlace para verificar tu email.');
    } catch (error: any) {
      setServerError(error?.response?.data?.message ?? 'No se pudo registrar el usuario.');
    }
  });

  return (
    <form className="card grid auth-card register-card" onSubmit={onSubmit} noValidate>
      <div className="auth-card__heading">
        <button className="back-button" type="button" onClick={() => navigate('/login')} aria-label="Volver al login">←</button>
        <div>
          <p className="eyebrow">NUEVA CUENTA</p>
          <h2>Crear cuenta</h2>
        </div>
      </div>

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        registration={register('email', {
          required: 'El email es obligatorio.',
          validate: (value) => /^\S+@\S+\.\S+$/.test(value.trim()) || 'Formato de email inválido.'
        })}
        error={errors.email}
      />

      <TextField
        label="Username"
        autoComplete="username"
        registration={register('username', {
          required: 'El username es obligatorio.',
          validate: (value) =>
            usernamePattern.test(value.trim()) || 'Usá 3-40 caracteres: letras, números, _ o .'
        })}
        error={errors.username}
      />

      <TextField
        label="Nombre visible"
        registration={register('displayName', {
          required: 'El nombre visible es obligatorio.',
          minLength: { value: 2, message: 'Debe tener al menos 2 caracteres.' },
          maxLength: { value: 80, message: 'Máximo 80 caracteres.' }
        })}
        error={errors.displayName}
      />

      <div className="grid grid--2">
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          registration={register('password', {
            required: 'La contraseña es obligatoria.',
            validate: (value) =>
              strongPasswordPattern.test(value) ||
              'La contraseña debe tener entre 6 y 72 caracteres.'
          })}
          error={errors.password}
        />

        <TextField
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          registration={register('confirmPassword', {
            required: 'Confirmá la contraseña.',
            validate: (value) => value === password || 'Las contraseñas no coinciden.'
          })}
          error={errors.confirmPassword}
        />
      </div>

      {serverError && <StatusMessage kind="error">{serverError}</StatusMessage>}
      {status && <StatusMessage kind="success">{status}</StatusMessage>}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Registrando...' : 'Registrarme'}
      </button>
      <p className="muted auth-footnote">¿Ya tenés cuenta? <Link to="/login">Ingresar</Link></p>
    </form>
  );
};

// Este archivo exporta: RegisterPage.
// Se usa en: App.tsx.
// Importa de: react-hook-form, React Router, componentes, API y validadores.
