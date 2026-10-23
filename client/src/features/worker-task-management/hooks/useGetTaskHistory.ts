import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import type { IssueResponse } from '@/features/all-tasks/types/index.types';
import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getTaskHistory } from '../api/index.api';
import { WORKERBYID } from '../consts/query-key.consts';
import { workerQueries } from '../query-options/queries/worker.queries';

function clearMention(queryClient: QueryClient, taskId: string) {
  queryClient.setQueryData<IssueResponse[]>([FETCHDESCRIPTION], (tasks) =>
    tasks?.map((task) =>
      task.id === taskId ? { ...task, mentioned: false } : task
    )
  );
  queryClient.setQueriesData<WorkerDetailResponse>(
    { queryKey: [WORKERBYID] },
    (worker) => {
      if (!worker?.data.engagements) return worker;
      return {
        ...worker,
        data: {
          ...worker.data,
          engagements: worker.data.engagements.map((engagement) => ({
            ...engagement,
            issues: engagement.issues?.map((issue) =>
              issue.id === taskId ? { ...issue, mentioned: false } : issue
            ),
          })),
        },
      };
    }
  );
}

export const useGetTaskHistory = (taskId: string) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    ...workerQueries.getTaskHistory(taskId),
    queryFn: async () => {
      const history = await getTaskHistory(taskId);
      clearMention(queryClient, taskId);
      return history;
    },
  });

  return {
    historyData: data,
    isLoading,
    error,
    refetchHistory: refetch,
  };
};
