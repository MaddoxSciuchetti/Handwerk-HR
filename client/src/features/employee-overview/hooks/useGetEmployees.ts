import { useQuery } from '@tanstack/react-query';
import { employeeQueries } from '../query-options/queries/employee.queries';
import { OrgUsersArray } from '../schemas/schema';

function useGetOrgUsers() {
  const {
    data: OrgUsers,
    error,
    isError,
    isLoading,
  } = useQuery<OrgUsersArray>(employeeQueries.getEmployees());
  return {
    OrgUsers,
    error,
    isError,
    isLoading,
  };
}

export default useGetOrgUsers;
