import { createContext } from 'react';
import { TemplateModalContextProps } from './TaskContextProvider';

export const TemplateModalContext =
  createContext<TemplateModalContextProps | null>(null);
