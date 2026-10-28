import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { workerQueries } from '../query-options/queries/worker.queries';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import { PERSONNEL_DOCUMENTS } from '../consts/query-key.consts';
import { employmentContractKey } from './useEmploymentContract';

function useTaskData(workerId: string, tasksVisible = true) {
  const cache = useQueryClient();
  const { data, error, isLoading, isError, refetch } = useQuery(
    workerQueries.taskData(workerId)
  );
  const wasTasksVisible = useRef(tasksVisible);
  const refreshedSubmissions = useRef(new Set<string>());

  useEffect(() => {
    const completed =
      data?.data.engagements.filter((engagement) => {
        const submission = engagement.questionnaireSubmission;
        return (
          submission?.status === 'completed' &&
          !refreshedSubmissions.current.has(submission.id)
        );
      }) ?? [];
    if (!completed.length) return;
    for (const engagement of completed) {
      refreshedSubmissions.current.add(engagement.questionnaireSubmission!.id);
      void cache.invalidateQueries({
        queryKey: employmentContractKey(workerId, engagement.id),
      });
      void cache.invalidateQueries({
        queryKey: ['completed-questionnaire', workerId, engagement.id],
      });
      void cache.invalidateQueries({
        queryKey: ['questionnaire-draft', engagement.id],
      });
    }
    void cache.invalidateQueries({ queryKey: [PERSONNEL_DOCUMENTS, workerId] });
    void cache.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
    void cache.invalidateQueries({ queryKey: [ALL_WORKER_DATA], exact: true });
    cache.setQueryData([ALL_WORKER_DATA, 'detail', workerId], data);
  }, [cache, data, workerId]);

  useEffect(() => {
    // The worker query stays mounted while other worker tabs are open.
    if (tasksVisible && !wasTasksVisible.current) void refetch();
    wasTasksVisible.current = tasksVisible;
  }, [tasksVisible, refetch]);

  return {
    data,
    error,
    isLoading,
    isError,
  };
}

export default useTaskData;
