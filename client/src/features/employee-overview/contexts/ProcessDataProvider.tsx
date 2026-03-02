import useFetchProcessData from '../hooks/use-fetchProcessData';
import { ProcessDataProviderProps } from '../types/context.types';
import { ProcessDataContext } from './ProcessDataContext';

export const ProcessDataProvider = ({ children }: ProcessDataProviderProps) => {
  const getProcessData = (id: number, form_type: string) => {
    const { queryResult } = useFetchProcessData(id, form_type);

    const completedTasksCount = queryResult.data?.form?.fields
      ? queryResult.data.form.fields.filter(
          (field) => field.status === 'erledigt'
        ).length
      : null;

    const totalTasks = queryResult.data?.form?.fields
      ? queryResult.data.form.fields.filter((field) => field.status).length
      : null;

    return {
      ...queryResult,
      completedTasksCount,
      totalTasks,
    };
  };

  return (
    <ProcessDataContext.Provider value={{ getProcessData }}>
      {children}
    </ProcessDataContext.Provider>
  );
};
