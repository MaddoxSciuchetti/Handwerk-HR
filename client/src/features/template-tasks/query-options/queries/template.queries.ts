import { DescriptionResponse } from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';
import { getTemplateTask } from '../../api';
import { DESCRIPTION_ROOT } from '../../consts/query-key.consts';

export const templateQueries = {
  getTask: () => {
    return queryOptions<DescriptionResponse[]>({
      queryKey: [DESCRIPTION_ROOT],
      queryFn: getTemplateTask,
    });
  },
};
