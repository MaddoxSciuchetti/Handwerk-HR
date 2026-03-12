import { ReactNode, useEffect, useMemo, useState } from 'react';
import { CreateDarkModecontext } from './themecontext';

const STORAGE_KEY = 'theme-preference';
const isBrowser = typeof window !== 'undefined';

const getInitialTheme = (): 'light' | 'dark' => {
  if (!isBrowser) return 'light';

  const storedTheme = localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  const toggleModal = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (!isBrowser) return;

    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggle: toggleModal, setTheme }),
    [theme]
  );

  return (
    <CreateDarkModecontext.Provider value={value}>
      {children}
    </CreateDarkModecontext.Provider>
  );
}
