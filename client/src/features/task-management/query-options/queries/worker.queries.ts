import { queryOptions } from '@tanstack/react-query';
import { getWorkerFiles, getWorkerHistory } from '../../api/index.api';
import { FORMHISTORY, HISTORYDATA } from '../../consts/query-key.consts';
import { File_Request, HistoryData } from '../../types/index.types';

export const workerQueries = {
  getFiles: (id: number) =>
    queryOptions<File_Request[], Error, File_Request[]>({
      queryKey: [HISTORYDATA, id] as const,
      queryFn: () => getWorkerFiles(id),
    }),

  getHistory: (id: number) =>
    queryOptions<HistoryData[], Error>({
      queryKey: [FORMHISTORY, id] as const,
      queryFn: () => getWorkerHistory(id),
      enabled: !!id,
    }),
};
