import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StatusMessage } from '../components/StatusMessage';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { LinkedAccounts } from '../components/LinkedAccounts';
import { strongPasswordPattern, usernamePattern } from '../utils/validators';

type ProfileForm = { email: string; username: string; displayName: string; bio: string };
type PasswordForm = { currentPassword: string; newPassword: string; confirmNewPassword: string };

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      email: user?.email ?? '',
      username: user?.username ?? '',
      displayName: user?.displayName ?? '',
      bio: user?.bio ?? ''
    }
  });
  const passwordForm = useForm<PasswordForm>();

  useEffect(() => {
    if (user) {
      profileForm.reset({
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio
      });
    }
  }, [user]);

  const saveProfile = profileForm.handleSubmit(async (data) => {
    setError('');
    setMessage('');
    try {
      await authApi.updateProfile(data);
      await refreshUser();
      setMessage(
        data.email.trim().toLowerCase() !== user?.email
          ? 'Perfil actualizado. Verificá el nuevo email desde tu correo.'
          : 'Perfil actualizado.'
      );
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? 'No se pudo actualizar el perfil.');
    }
  });

  const savePassword = passwordForm.handleSubmit(async (data) => {
    setError('');
    setMessage('');
    try {
      await authApi.changePassword(data);
      passwordForm.reset();
      setMessage('Contraseña actualizada.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? 'No se pudo cambiar la contraseña.');
    }
  });

  if (!user) return null;

  return (
    <section className="page">
      <div className="card">
        <h2>Mi perfil</h2>
        <p>
          <strong>Rol:</strong> {user.role}
        </p>

        <form className="grid" onSubmit={saveProfile}>
          <TextField
            label="Email"
            type="email"
            registration={profileForm.register('email', {
              required: 'El email es obligatorio.',
              validate: (value) => /^\S+@\S+\.\S+$/.test(value.trim()) || 'Email inválido.'
            })}
            error={profileForm.formState.errors.email}
          />
          <TextField
            label="Username"
            registration={profileForm.register('username', {
              required: 'El username es obligatorio.',
              validate: (value) =>
                usernamePattern.test(value.trim()) || 'Usá letras, números, _ o .'
            })}
            error={profileForm.formState.errors.username}
          />
          <TextField
            label="Nombre visible"
            registration={profileForm.register('displayName', {
              required: 'El nombre es obligatorio.',
              minLength: { value: 2, message: 'Mínimo 2 caracteres.' },
              maxLength: { value: 80, message: 'Máximo 80 caracteres.' }
            })}
            error={profileForm.formState.errors.displayName}
          />
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" maxLength={280} {...profileForm.register('bio')} />
          </div>
          <button disabled={profileForm.formState.isSubmitting}>Guardar perfil</button>
        </form>
      </div>

      <LinkedAccounts provider={user.authProvider} emailVerified={user.emailVerified} />
      {user.hasPassword === false ? (
        <section className="card">
          <h2>Contraseña</h2>
          <p>Esta cuenta usa acceso social y no tiene una contraseña local.</p>
        </section>
      ) : (
        <form className="card grid" onSubmit={savePassword}>
          <h2>Cambiar contraseña</h2>
          <TextField
            label="Contraseña actual"
            type="password"
            registration={passwordForm.register('currentPassword', {
              required: 'Ingresá la contraseña actual.'
            })}
            error={passwordForm.formState.errors.currentPassword}
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            registration={passwordForm.register('newPassword', {
              required: 'Ingresá una nueva contraseña.',
              validate: (value) =>
                strongPasswordPattern.test(value) ||
                'La contraseña debe tener entre 6 y 72 caracteres.'
            })}
            error={passwordForm.formState.errors.newPassword}
          />
          <TextField
            label="Confirmar nueva contraseña"
            type="password"
            registration={passwordForm.register('confirmNewPassword', {
              required: 'Confirmá la nueva contraseña.',
              validate: (value) =>
                value === passwordForm.watch('newPassword') || 'Las contraseñas no coinciden.'
            })}
            error={passwordForm.formState.errors.confirmNewPassword}
          />
          <button disabled={passwordForm.formState.isSubmitting}>Actualizar contraseña</button>
        </form>
      )}
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
      {message && <StatusMessage kind="success">{message}</StatusMessage>}
    </section>
  );
};

// Este archivo exporta: ProfilePage.
// Se usa en: App.tsx.
// Importa de: React, react-hook-form, AuthContext, API y validadores.
