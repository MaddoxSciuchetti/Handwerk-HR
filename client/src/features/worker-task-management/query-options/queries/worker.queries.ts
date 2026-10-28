import { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import { workerRefreshInterval } from '@/features/worker-lifecycle/utils/workerRefreshInterval';
import { queryOptions } from '@tanstack/react-query';
import {
  getTaskHistory,
  getWorkerById,
  getWorkerFiles,
} from '../../api/index.api';
import {
  HISTORYDATA,
  TASKHISTORY,
  WORKERBYID,
} from '../../consts/query-key.consts';
import { File_Request, TaskHistoryItem } from '../../types/index.types';

export const workerQueries = {
  getFiles: (workerId: string) =>
    queryOptions<File_Request[], Error, File_Request[]>({
      queryKey: [HISTORYDATA, workerId] as const,
      staleTime: 30_000,
      queryFn: () => getWorkerFiles(workerId),
    }),
  getTaskHistory: (taskId: string) =>
    queryOptions<TaskHistoryItem[], Error>({
      queryKey: [TASKHISTORY, taskId] as const,
      queryFn: () => getTaskHistory(taskId),
      enabled: !!taskId,
    }),

  taskData: (workerId: string) =>
    queryOptions<WorkerDetailResponse, Error>({
      queryKey: [WORKERBYID, workerId],
      staleTime: 30_000,
      refetchOnMount: 'always',
      queryFn: () => getWorkerById(workerId),
      refetchInterval: (query) =>
        workerRefreshInterval(query.state.data?.data.engagements),
    }),
};
