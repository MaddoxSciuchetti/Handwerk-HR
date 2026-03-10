import { createContext } from 'react';

export type Context = {
  theme: 'dark' | 'light';
  toggle: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
};

export const CreateDarkModecontext = createContext<Context>({
  theme: 'light',
  toggle: () => {},
  setTheme: () => {},
});
