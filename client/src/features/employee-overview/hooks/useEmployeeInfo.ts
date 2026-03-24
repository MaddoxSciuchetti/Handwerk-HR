import { useQuery } from '@tanstack/react-query';
import { employeeQueries } from '../query-options/queries/employee.queries';

function useEmployeeInfo(employeeId: string, enabled: boolean) {
  const { data, isLoading, isError } = useQuery({
    ...employeeQueries.employeeById(employeeId),
    enabled,
  });

  return { employeeInfo: data, isLoading, isError };
}

export default useEmployeeInfo;
