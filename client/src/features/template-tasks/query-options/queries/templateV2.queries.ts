import { queryOptions } from '@tanstack/react-query';
import {
  fetchIssueTemplateById,
  fetchIssueTemplates,
  type IssueTemplateDetail,
  type IssueTemplateListItem,
} from '../../api/templateV2.api';
import { ISSUE_TEMPLATES_V2 } from '../../consts/query-key.consts';

export const templateV2Queries = {
  list: () =>
    queryOptions<IssueTemplateListItem[], Error>({
      queryKey: [ISSUE_TEMPLATES_V2, 'list'] as const,
      queryFn: fetchIssueTemplates,
    }),

  detail: (templateId: string) =>
    queryOptions<IssueTemplateDetail, Error>({
      queryKey: [ISSUE_TEMPLATES_V2, 'detail', templateId] as const,
      queryFn: () => fetchIssueTemplateById(templateId),
      enabled: !!templateId,
    }),
};
