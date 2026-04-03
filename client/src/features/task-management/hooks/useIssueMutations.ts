import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';
import { Employees } from '../types/index.types';

function useIssueMutations(workerId: string) {
  const { data: workerRes } = useQuery(workerQueries.workerDetail(workerId));
  const { data: statuses = [] } = useQuery(
    workerQueries.issueStatuses(workerId)
  );
  const { data: employees = [] } = useQuery<Employees>(
    employeeQueries.getEmployees()
  );

  return {
    workerRes,
    statuses,
    employees,
  };
}

export default useIssueMutations;
