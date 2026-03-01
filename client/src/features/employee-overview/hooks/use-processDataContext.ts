import { useContext } from 'react';
import { ProcessDataContext } from '../contexts/ProcessDataContext';

export const useProcessDataContext = () => {
  const context = useContext(ProcessDataContext);
  if (context === undefined) {
    throw new Error(
      'useProcessDataContext must be used within a ProcessDataProvider'
    );
  }
  return context;
};
