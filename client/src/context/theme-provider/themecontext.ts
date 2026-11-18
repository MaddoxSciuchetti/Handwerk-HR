import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export type ThemeControls = {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
};

/** React consumers only (ProfileDropdown sun/moon toggle). Root .dark / --theme live in ThemeDocumentProvider. */
export const ThemeControlsContext = createContext<ThemeControls | null>(null);

/** @deprecated Use ThemeControlsContext — kept name for any stray imports. */
export const CreateDarkModecontext = ThemeControlsContext;
