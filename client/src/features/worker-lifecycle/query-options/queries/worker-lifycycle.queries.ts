import { getWorkerById } from '@/features/task-management/api/index.api';
import { DescriptionFieldResponse } from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';
import { getWorkerData } from '../../api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import { FormType, WorkerItem, WorkerListMode } from '../../types/index.types';

export const workerLifecycleQueries = {
  workerData: (mode: WorkerListMode = 'active') => {
    return queryOptions<WorkerItem[]>({
      queryKey: [ALL_WORKER_DATA, mode],
      queryFn: () => getWorkerData(mode),
    });
  },
  workerById: (workerId: number, lifecycleType: FormType) => {
    return queryOptions<DescriptionFieldResponse>({
      queryKey: [ALL_WORKER_DATA, 'detail', workerId, lifecycleType],
      queryFn: () => getWorkerById(workerId, lifecycleType),
    });
  },
};
