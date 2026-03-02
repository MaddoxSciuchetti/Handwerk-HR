import { createContext } from 'react';
import { Context } from './ThemeContext';

export const CreateDarkModecontext = createContext<Context>({
  theme: 'light',
  toggle: () => {},
});
