import { TemplateTaskResponse } from '@/features/worker-task-management/types/index.types';
import { queryOptions } from '@tanstack/react-query';
import { getTemplatesV2, getTemplateTask } from '../../api';
import {
  DESCRIPTION_ROOT,
  TEMPLATES_LIST_ROOT,
} from '../../consts/query-key.consts';
import type { IssueTemplateListItem } from '../../types/template.types';

export const templateQueries = {
  getTasks: (templateId: string) => {
    return queryOptions<TemplateTaskResponse[]>({
      queryKey: [DESCRIPTION_ROOT],
      queryFn: () => getTemplateTask(templateId),
    });
  },

  getTemplates: () => {
    return queryOptions<IssueTemplateListItem[]>({
      queryKey: [TEMPLATES_LIST_ROOT],
      queryFn: getTemplatesV2,
    });
  },
};
