import { useContext } from 'react';
import { TemplateModalContext } from '../TaskContext';

function useTemplateModalContext() {
  const context = useContext(TemplateModalContext);
  if (!context) {
    throw new Error('TaskContextProvder must be used within the provider');
  }
  return context;
}

export default useTemplateModalContext;
