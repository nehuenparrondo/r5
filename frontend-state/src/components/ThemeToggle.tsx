import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
    </button>
  );
};

// Este archivo exporta: ThemeToggle.
// Se usa en: App.tsx.
// Importa de: context/ThemeContext.tsx.
