import { getWorkerById } from '@/features/worker-task-management/api/index.api';
import { queryOptions } from '@tanstack/react-query';
import { getWorkerData } from '../../api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import { WorkerDetailResponse, WorkerRecord } from '../../types/index.types';

export const workerLifecycleQueries = {
  workerData: () => {
    return queryOptions<WorkerRecord[]>({
      queryKey: [ALL_WORKER_DATA],
      queryFn: () => getWorkerData(),
    });
  },
  workerById: (workerId: string) => {
    return queryOptions<WorkerDetailResponse>({
      queryKey: [ALL_WORKER_DATA, 'detail', workerId],
      queryFn: () => getWorkerById(workerId),
    });
  },
};
