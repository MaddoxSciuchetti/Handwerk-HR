import { createContext } from 'react';
import { ProcessDataContextType } from '../types/context.types';

export const ProcessDataContext = createContext<
  ProcessDataContextType | undefined
>(undefined);
