import { getWorkerById } from '@/features/task-management/api/index.api';
import { queryOptions } from '@tanstack/react-query';
import { getWorkerData } from '../../api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import {
  WorkerDetailResponse,
  WorkerRecord,
  WorkerRecordMode,
} from '../../types/index.types';

export const workerLifecycleQueries = {
  workerData: (mode: WorkerRecordMode = 'active') => {
    return queryOptions<WorkerRecord[]>({
      queryKey: [ALL_WORKER_DATA, mode],
      queryFn: () => getWorkerData(mode),
    });
  },
  workerById: (workerId: string) => {
    return queryOptions<WorkerDetailResponse>({
      queryKey: [ALL_WORKER_DATA, 'detail', workerId],
      queryFn: () => getWorkerById(workerId),
    });
  },
};
