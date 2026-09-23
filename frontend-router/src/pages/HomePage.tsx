import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { user } = useAuth();

  return (
    <section className="hero">
      <p className="muted">React Router + Context + API segura</p>
      <h1>Sistema de usuarios</h1>
      <p>
        Registro, autenticación, perfil protegido y administración con MySQL.
      </p>
      <div className="actions">
        {user ? <Link to="/perfil">Ir a mi perfil</Link> : <Link to="/registro">Crear cuenta</Link>}
      </div>
    </section>
  );
};

// Este archivo exporta: HomePage.
// Se usa en: App.tsx.
// Importa de: React Router y AuthContext.
