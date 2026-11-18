import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export type ThemeControls = {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
};

/** React consumers only (Layout class toggle, ProfileDropdown sun/moon). */
export const ThemeControlsContext = createContext<ThemeControls | null>(null);

/** @deprecated Use ThemeControlsContext — kept name for any stray imports. */
export const CreateDarkModecontext = ThemeControlsContext;
