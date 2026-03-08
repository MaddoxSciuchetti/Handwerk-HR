import { queryOptions } from '@tanstack/react-query';
import { getWorkerData } from '../../api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import { WorkerItem } from '../../types/index.types';

export const workerLifecycleQueries = {
  workerData: () => {
    return queryOptions<WorkerItem[]>({
      queryKey: [ALL_WORKER_DATA],
      queryFn: getWorkerData,
    });
  },
};
