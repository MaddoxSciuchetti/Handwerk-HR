import { useQuery } from '@tanstack/react-query';
import { employeeQueries } from '../query-options/queries/employee.queries';

function useFetchProcessData(id: string) {
  const queryResult = useQuery(employeeQueries.fetchDescription(id));

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
