import { DescriptionResponse } from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';
import { getTemplatesV2, getTemplateTask } from '../../api';
import {
  DESCRIPTION_ROOT,
  TEMPLATES_LIST_ROOT,
} from '../../consts/query-key.consts';
import type { IssueTemplateListItem } from '../../types/template.types';

export const templateQueries = {
  getTask: () => {
    return queryOptions<DescriptionResponse[]>({
      queryKey: [DESCRIPTION_ROOT],
      queryFn: getTemplateTask,
    });
  },

  getTemplates: () => {
    return queryOptions<IssueTemplateListItem[]>({
      queryKey: [TEMPLATES_LIST_ROOT],
      queryFn: getTemplatesV2,
    });
  },
};
