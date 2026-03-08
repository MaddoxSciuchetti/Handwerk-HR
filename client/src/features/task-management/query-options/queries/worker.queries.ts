import { DescriptionFieldResponse } from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';
import {
  getWorkerById,
  getWorkerFiles,
  getWorkerHistory,
} from '../../api/index.api';
import {
  FORMHISTORY,
  HISTORYDATA,
  WORKERBYID,
} from '../../consts/query-key.consts';
import { File_Request, HistoryData } from '../../types/index.types';

export const workerQueries = {
  getFiles: (workerId: number) =>
    queryOptions<File_Request[], Error, File_Request[]>({
      queryKey: [HISTORYDATA, workerId] as const,
      queryFn: () => getWorkerFiles(workerId),
    }),

  getHistory: (workerId: number) =>
    queryOptions<HistoryData[], Error>({
      queryKey: [FORMHISTORY, workerId] as const,
      queryFn: () => getWorkerHistory(workerId),
      enabled: !!workerId,
    }),

  taskData: (workerId: number, lifecycleType: string) =>
    queryOptions<DescriptionFieldResponse, Error>({
      queryKey: [WORKERBYID, workerId],
      queryFn: () => getWorkerById(workerId, lifecycleType),
    }),
};
