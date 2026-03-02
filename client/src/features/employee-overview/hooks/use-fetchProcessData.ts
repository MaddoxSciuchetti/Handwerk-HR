import { DescriptionFieldResponse } from '@/types/api.types';
import { useQuery } from '@tanstack/react-query';
import { fetchDescriptionData } from '../api/employee-overview.api';

function useFetchProcessData(id: number, form_type: string) {
  const queryResult = useQuery<DescriptionFieldResponse>({
    queryKey: ['processData', id, form_type],
    queryFn: () => fetchDescriptionData(id, form_type),
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
}

export default useFetchProcessData;
