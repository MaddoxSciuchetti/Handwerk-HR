import { queryOptions } from '@tanstack/react-query';
import { getEmployeeWorkerData } from '../../api/index.api';
import { CEO_DASHBOARD } from '../../consts/query-key.consts';
import { EmployeeWorker } from '../../types/employeeform.types';

export const adminQueries = {
  EmployeeWorker: () => {
    return queryOptions<EmployeeWorker>({
      queryKey: [CEO_DASHBOARD],
      queryFn: getEmployeeWorkerData,
    });
  },
};
