import { useQuery } from '@tanstack/react-query';
import { employeeQueries } from '../query-options/queries/employee.queries';
import { EmployeeDataArray } from '../schemas/schema';

function useGetEmployees() {
  const {
    data: EmployeeData,
    error,
    isError,
    isLoading,
  } = useQuery<EmployeeDataArray>(employeeQueries.getEmployees());

  return {
    EmployeeData,
    error,
    isError,
    isLoading,
  };
}

export default useGetEmployees;
