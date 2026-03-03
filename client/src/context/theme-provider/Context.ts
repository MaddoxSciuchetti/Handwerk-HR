import { createContext } from 'react';

export type Context = {
  theme: 'dark' | 'light';
  toggle: () => void;
};

export const CreateDarkModecontext = createContext<Context>({
  theme: 'light',
  toggle: () => {},
});
