import { createContext } from 'react';
import { EmployeeModalContextType } from './ModalProvider';

export const EmployeeModalContext =
  createContext<EmployeeModalContextType | null>(null);
