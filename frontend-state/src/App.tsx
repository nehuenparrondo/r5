import { useEffect, useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { useAuth } from './context/AuthContext';
import { authApi } from './services/api';
import { AdminScreen } from './screens/AdminScreen';
import { LoginScreen, RegisterScreen, VerifyEmailScreen } from './screens/AuthScreens';
import { ProfileScreen } from './screens/ProfileScreen';

type Screen = 'login' | 'register' | 'verify' | 'profile' | 'admin';

const initialScreen = (): Screen => {
  if (window.location.pathname === '/verificar-email' && new URLSearchParams(window.location.search).has('token')) {
    return 'verify';
  }
  return 'login';
};

export const App = () => {
  const { user, setUser } = useAuth();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((response) => {
        const sessionUser = response.user ?? null;
        setUser(sessionUser);
        if (sessionUser && screen !== 'verify') setScreen('profile');
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !user && (screen === 'profile' || screen === 'admin')) setScreen('login');
    if (!loading && user?.role !== 'admin' && screen === 'admin') setScreen('profile');
  }, [loading, user, screen]);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setScreen('login');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand brand-button" type="button" onClick={() => setScreen(user ? 'profile' : 'login')}>
          <span className="brand__mark" aria-hidden="true">U</span>
          Usuarios SQL
        </button>
        {user && (
          <nav className="nav" aria-label="Navegación por estado">
            <button className="nav-link" type="button" onClick={() => setScreen('profile')}>Perfil</button>
            {user.role === 'admin' && <button className="nav-link" type="button" onClick={() => setScreen('admin')}>Admin</button>}
            <button type="button" onClick={logout}>Salir</button>
          </nav>
        )}
      </header>

      <main>
        {loading && <section className="card">Verificando sesión...</section>}
        {!loading && screen === 'login' && !user && <LoginScreen onDone={() => setScreen('profile')} onRegister={() => setScreen('register')} />}
        {!loading && screen === 'register' && !user && <RegisterScreen onBack={() => setScreen('login')} />}
        {!loading && screen === 'verify' && (
          <VerifyEmailScreen token={new URLSearchParams(window.location.search).get('token') ?? ''} onDone={() => setScreen('login')} />
        )}
        {!loading && screen === 'profile' && user && <ProfileScreen />}
        {!loading && screen === 'admin' && user?.role === 'admin' && <AdminScreen />}
      </main>
      <ThemeToggle />
    </div>
  );
};
