import { ReactNode, useState } from 'react';
import { CreateDarkModecontext } from './Context';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleModal = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <CreateDarkModecontext.Provider
      value={{ theme: theme, toggle: toggleModal }}
    >
      {children}
    </CreateDarkModecontext.Provider>
  );
}
