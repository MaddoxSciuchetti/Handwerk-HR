import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import { DescriptionFieldResponse } from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';
import {
  getIssueAuditLogs,
  getWorkerById,
  getWorkerFiles,
  getWorkerHistory,
  getWorkerIssueStatuses,
  type IssueStatusOption,
} from '../../api/index.api';
import {
  FORMHISTORY,
  HISTORYDATA,
  ISSUE_AUDIT,
  WORKERBYID,
  WORKER_ISSUE_STATUSES,
} from '../../consts/query-key.consts';
import {
  File_Request,
  HistoryData,
  LifecycleType,
} from '../../types/index.types';
import type { IssueAuditRow } from '../../utils/mapIssueAuditToHistory';
import { workerDetailToDescriptionFieldResponse } from '../../utils/workerDetailToTaskView';

export const workerQueries = {
  getFiles: (workerId: string | number) =>
    queryOptions<File_Request[], Error, File_Request[]>({
      queryKey: [HISTORYDATA, workerId] as const,
      queryFn: () => getWorkerFiles(workerId as number),
      enabled: typeof workerId === 'number' && workerId > 0,
    }),

  getHistory: (id: string | number) =>
    queryOptions<HistoryData[], Error>({
      queryKey: [FORMHISTORY, id] as const,
      queryFn: () => getWorkerHistory(id as number),
      enabled: typeof id === 'number' && id > 0,
    }),

  taskData: (workerId: string, lifecycleType: LifecycleType) =>
    queryOptions<DescriptionFieldResponse, Error>({
      queryKey: [WORKERBYID, workerId, lifecycleType] as const,
      queryFn: async () => {
        const res = await getWorkerById(workerId);
        if (!res?.success || !res.data) {
          throw new Error('Worker not found');
        }
        return workerDetailToDescriptionFieldResponse(res, lifecycleType);
      },
      enabled: !!workerId && !!lifecycleType,
    }),

  workerDetail: (workerId: string) =>
    queryOptions<WorkerDetailResponse, Error>({
      queryKey: [WORKERBYID, workerId, 'detail'] as const,
      queryFn: async () => {
        const res = await getWorkerById(workerId);
        if (!res?.success || !res.data) {
          throw new Error('Worker not found');
        }
        return res;
      },
      enabled: !!workerId,
    }),

  issueStatuses: (workerId: string) =>
    queryOptions<IssueStatusOption[], Error>({
      queryKey: [WORKER_ISSUE_STATUSES, workerId] as const,
      queryFn: () => getWorkerIssueStatuses(workerId),
      enabled: !!workerId,
    }),

  issueAuditLogs: (workerId: string, issueId: string) =>
    queryOptions<IssueAuditRow[], Error>({
      queryKey: [ISSUE_AUDIT, workerId, issueId] as const,
      queryFn: () => getIssueAuditLogs(workerId, issueId),
      enabled: !!workerId && !!issueId,
    }),
};
