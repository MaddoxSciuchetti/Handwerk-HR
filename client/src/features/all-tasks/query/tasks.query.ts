import { queryOptions } from '@tanstack/react-query';
import { getTasks } from '../api/tasks.api';
import { FETCHDESCRIPTION } from '../consts/query.consts';

export const tasksQueries = {
  fetchTasks: () => {
    return queryOptions({ queryKey: [FETCHDESCRIPTION], queryFn: getTasks });
  },
};
