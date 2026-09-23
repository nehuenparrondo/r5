import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeToggle } from './components/ThemeToggle';
import { useAuth } from './context/AuthContext';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

export const App = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to={user ? '/perfil' : '/'}>
          <span className="brand__mark" aria-hidden="true">U</span>
          Usuarios SQL
        </Link>
        {user && (
          <nav className="nav" aria-label="Navegación principal">
            <Link to="/perfil">Perfil</Link>
            {user.role === 'admin' && <Link to="/admin">Admin</Link>}
            <button type="button" onClick={handleLogout}>Salir</button>
          </nav>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/perfil" replace /> : <LoginPage />} />
          <Route path="/registro" element={user ? <Navigate to="/perfil" /> : <RegisterPage />} />
          <Route path="/login" element={user ? <Navigate to="/perfil" replace /> : <LoginPage />} />
          <Route path="/verificar-email" element={<VerifyEmailPage />} />
          <Route
            path="/perfil"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ThemeToggle />
    </div>
  );
};

// Este archivo exporta: App.
// Se usa en: main.tsx.
// Importa de: React Router, contextos, componentes y páginas.
