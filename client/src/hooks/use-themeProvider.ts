import { CreateDarkModecontext } from '@/context/theme-provider/Context';
import { useContext } from 'react';

export function useThemeProvider() {
  const context = useContext(CreateDarkModecontext);
  if (!context) {
    throw new Error('theme provider must be used in the context');
  }
  return context;
}
