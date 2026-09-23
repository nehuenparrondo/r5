import { useEffect, useState } from 'react';
import { StatusMessage } from '../components/StatusMessage';
import { authApi } from '../services/api';
import type { User } from '../types';

type AdminUser = User & { createdAt?: string };

export const AdminScreen = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .listUsers()
      .then((response) => setUsers((response.users ?? []) as AdminUser[]))
      .catch((requestError) => setError(requestError.message ?? 'No se pudo cargar usuarios.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card admin-card">
      <div className="admin-heading">
        <div><p className="eyebrow">PANEL ADMIN</p><h2>Usuarios registrados</h2></div>
        {!loading && !error && <span className="user-count">{users.length} usuarios</span>}
      </div>
      <p className="muted">Consultá las cuentas, roles y el estado de verificación. Las contraseñas nunca se muestran.</p>
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
      {loading && <StatusMessage kind="info">Cargando usuarios...</StatusMessage>}
      {!loading && !error && users.length === 0 && <StatusMessage kind="info">Todavía no hay usuarios registrados.</StatusMessage>}
      {!loading && users.length > 0 && <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Usuario</th><th>Email</th><th>Nombre</th><th>Rol</th><th>Verificación</th><th>Alta</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.displayName}</td>
                <td><span className={`role-badge role-badge--${user.role}`}>{user.role}</span></td>
                <td><span className={`verify-badge ${user.emailVerified ? 'verify-badge--ok' : ''}`}>{user.emailVerified ? 'Verificado' : 'Pendiente'}</span></td>
                <td>{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </section>
  );
};

// Este archivo exporta: AdminScreen.
// Se usa en: App.tsx de la versión useState.
// Importa de: React, API, tipos y StatusMessage.
