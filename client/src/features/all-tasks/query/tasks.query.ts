import { queryOptions } from '@tanstack/react-query';
import { getTasks } from '../api/tasks.api';
import { FETCHDESCRIPTION } from '../consts/query.consts';
import { tasksRefetchInterval } from './tasksRefetchInterval';

export const tasksQueries = {
  fetchTasks: () => {
    return queryOptions({
      queryKey: [FETCHDESCRIPTION],
      queryFn: getTasks,
      refetchInterval: () => tasksRefetchInterval(),
    });
  },
};
