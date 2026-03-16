import { queryOptions } from '@tanstack/react-query';
import { getWorkerData } from '../../api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import { WorkerItem, WorkerListMode } from '../../types/index.types';

export const workerLifecycleQueries = {
  workerData: (mode: WorkerListMode = 'active') => {
    return queryOptions<WorkerItem[]>({
      queryKey: [ALL_WORKER_DATA, mode],
      queryFn: () => getWorkerData(mode),
    });
  },
};
