import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = 'savent-theme';

function initialTheme(): Theme {
  const saved = window.localStorage.getItem(storageKey);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error('ThemeToggle must be used inside ThemeProvider');
  const nextTheme = context.theme === 'light' ? 'dark' : 'light';

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={context.theme === 'dark'}
      className={`theme-toggle${compact ? ' compact' : ''}`}
      onClick={context.toggleTheme}
      type="button"
    >
      <span aria-hidden="true">{context.theme === 'light' ? '☾' : '☀'}</span>
      {compact ? null : (
        <span>{context.theme === 'light' ? 'Dark' : 'Light'}</span>
      )}
    </button>
  );
}
