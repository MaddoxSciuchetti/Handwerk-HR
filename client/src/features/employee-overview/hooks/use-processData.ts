import { useProcessDataContext } from './use-processDataContext';

export const useProcessData = (id: number, form_type: string) => {
  const { getProcessData } = useProcessDataContext();

  return getProcessData(id, form_type);
};
