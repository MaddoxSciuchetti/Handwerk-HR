import { useQuery } from '@tanstack/react-query';
import { tasksQueries } from '../query/tasks.query';

export function useFetchTasks() {
  const { data, isLoading, isError } = useQuery(tasksQueries.fetchTasks());
  return { data, isLoading, isError };
}
