import { useQuery } from '@tanstack/react-query';
import { specificEmployeeData } from '../api/employee-overview.api';
import { EmployeeDataArray } from '../schemas/schema';

function useGetEmployees() {
  const {
    data: EmployeeData,
    isLoading,
    error,
    isError,
  } = useQuery<EmployeeDataArray>({
    queryKey: ['EmployeeDataSpecifics'],
    queryFn: specificEmployeeData,
  });

  return {
    EmployeeData,
    isLoading,
    error,
    isError,
  };
}

export default useGetEmployees;
