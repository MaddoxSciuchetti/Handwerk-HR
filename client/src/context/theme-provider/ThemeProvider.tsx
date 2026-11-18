import {
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  ThemeControlsContext,
  type Theme,
  type ThemeControls,
} from './themecontext';

const STORAGE_KEY = 'theme-preference';
const isBrowser = typeof window !== 'undefined';

const getInitialTheme = (): Theme => {
  if (!isBrowser) return 'light';

  const storedTheme = localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

function applyThemeDocument(theme: Theme) {
  if (!isBrowser) return;
  const root = document.documentElement;
  // Paint-time signal — CSS can key off var(--theme) without React re-renders.
  root.style.setProperty('--theme', theme);
  root.style.setProperty('color-scheme', theme);
  // Tailwind dark: tokens need the root class on every route, including
  // doorman pages (/login, /signup, …) that never mount Layout.
  root.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Document / CSS side: syncs theme to the root element.
 * Does not expose React state to the tree.
 */
export function ThemeDocumentProvider({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    applyThemeDocument(theme);
  }, [theme]);

  return children;
}

/**
 * React consumer side: only Layout and ProfileDropdown should read this.
 */
export function ThemeControlsProvider({
  value,
  children,
}: {
  value: ThemeControls;
  children: ReactNode;
}) {
  return (
    <ThemeControlsContext.Provider value={value}>
      {children}
    </ThemeControlsContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const controls = useMemo<ThemeControls>(
    () => ({
      theme,
      setTheme,
      toggle: () =>
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme]
  );

  return (
    <ThemeDocumentProvider theme={theme}>
      <ThemeControlsProvider value={controls}>
        {children}
      </ThemeControlsProvider>
    </ThemeDocumentProvider>
  );
}
