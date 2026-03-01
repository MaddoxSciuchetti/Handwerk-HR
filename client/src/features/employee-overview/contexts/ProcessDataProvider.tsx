import { api_Response } from '@/features/task-management/types/index.type';
import { useQuery } from '@tanstack/react-query';
import { fetchProcessData } from '../api/employee-overview.api';
import { ProcessDataProviderProps } from '../types/context.types';
import { ProcessDataContext } from './ProcessDataContext';

export const ProcessDataProvider = ({ children }: ProcessDataProviderProps) => {
  const getProcessData = (id: number, form_type: string) => {
    const queryResult = useQuery<api_Response>({
      queryKey: ['processData', id, form_type],
      queryFn: () => fetchProcessData(id, form_type),
    });

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
