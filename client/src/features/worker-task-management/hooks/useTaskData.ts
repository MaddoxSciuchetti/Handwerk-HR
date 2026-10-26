import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { workerQueries } from '../query-options/queries/worker.queries';

function useTaskData(workerId: string, tasksVisible = true) {
  const { data, error, isLoading, isError, refetch } = useQuery(
    workerQueries.taskData(workerId)
  );
  const wasTasksVisible = useRef(tasksVisible);

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
