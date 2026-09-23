import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StatusMessage } from '../components/StatusMessage';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { strongPasswordPattern, usernamePattern } from '../utils/validators';

export const ProfileScreen = () => {
  const { user, setUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const profile = useForm({
    defaultValues: {
      email: user?.email ?? '',
      username: user?.username ?? '',
      displayName: user?.displayName ?? '',
      bio: user?.bio ?? ''
    }
  });
  const password = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }>();

  if (!user) return null;

  const saveProfile = profile.handleSubmit(async (data) => {
    setError('');
    setMessage('');
    try {
      await authApi.updateProfile(data);
      const fresh = await authApi.me();
      setUser(fresh.user ?? null);
      setMessage('Perfil actualizado.');
    } catch (requestError: any) {
      setError(requestError.message ?? 'No se pudo guardar el perfil.');
    }
  });

  const savePassword = password.handleSubmit(async (data) => {
    setError('');
    setMessage('');
    try {
      await authApi.changePassword(data);
      password.reset();
      setMessage('Contraseña actualizada.');
    } catch (requestError: any) {
      setError(requestError.message ?? 'No se pudo cambiar la contraseña.');
    }
  });

  return (
    <section className="page">
      <form className="card grid" onSubmit={saveProfile}>
        <h2>Mi perfil</h2>
        <p><strong>Rol:</strong> {user.role}</p>
        <TextField
          label="Email"
          type="email"
          registration={profile.register('email', {
            required: 'Email obligatorio.',
            validate: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) || 'Email inválido.'
          })}
          error={profile.formState.errors.email}
        />
        <TextField
          label="Username"
          registration={profile.register('username', {
            required: 'Username obligatorio.',
            validate: (v) => usernamePattern.test(v.trim()) || 'Usá letras, números, _ o .'
          })}
          error={profile.formState.errors.username}
        />
        <TextField
          label="Nombre visible"
          registration={profile.register('displayName', { required: 'Nombre obligatorio.' })}
          error={profile.formState.errors.displayName}
        />
        <div className="field">
          <label htmlFor="bio-state">Bio</label>
          <textarea id="bio-state" maxLength={280} {...profile.register('bio')} />
        </div>
        <button>Guardar perfil</button>
      </form>

      <form className="card grid" onSubmit={savePassword}>
        <h2>Cambiar contraseña</h2>
        <TextField
          label="Contraseña actual"
          type="password"
          registration={password.register('currentPassword', { required: 'Campo obligatorio.' })}
          error={password.formState.errors.currentPassword}
        />
        <TextField
          label="Nueva contraseña"
          type="password"
          registration={password.register('newPassword', {
            required: 'Campo obligatorio.',
            validate: (v) => strongPasswordPattern.test(v) || 'La contraseña debe tener entre 6 y 72 caracteres.'
          })}
          error={password.formState.errors.newPassword}
        />
        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          registration={password.register('confirmNewPassword', {
            required: 'Campo obligatorio.',
            validate: (v) => v === password.watch('newPassword') || 'Las contraseñas no coinciden.'
          })}
          error={password.formState.errors.confirmNewPassword}
        />
        <button>Cambiar contraseña</button>
      </form>

      {error && <StatusMessage kind="error">{error}</StatusMessage>}
      {message && <StatusMessage kind="success">{message}</StatusMessage>}
    </section>
  );
};

// Este archivo exporta: ProfileScreen.
// Se usa en: App.tsx de la versión useState.
// Importa de: React, react-hook-form, contexto, API y validadores.
