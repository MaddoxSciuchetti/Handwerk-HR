import { createContext } from 'react';
import { EmployeeModalContextType } from './Provider';

export const EmployeeModalContext =
  createContext<EmployeeModalContextType | null>(null);
