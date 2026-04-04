import queryClient from '@/config/query.client';
import { mutationOptions } from '@tanstack/react-query';
import {
  createIssueTemplate,
  createTemplateItemV2,
  deleteIssueTemplate,
  deleteTemplateItemV2,
  type EngagementTemplateTypeV2,
} from '../../api/templateV2.api';
import { ISSUE_TEMPLATES_V2 } from '../../consts/query-key.consts';

export const templateV2Mutations = {
  createTemplate: () =>
    mutationOptions<
      Awaited<ReturnType<typeof createIssueTemplate>>,
      Error,
      { name: string; description?: string; type: EngagementTemplateTypeV2 }
    >({
      mutationFn: createIssueTemplate,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [ISSUE_TEMPLATES_V2] });
      },
    }),

  deleteTemplate: () =>
    mutationOptions<void, Error, string>({
      mutationFn: deleteIssueTemplate,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [ISSUE_TEMPLATES_V2] });
      },
    }),

  createItem: (templateId: string) =>
    mutationOptions<
      Awaited<ReturnType<typeof createTemplateItemV2>>,
      Error,
      { title: string; description?: string; orderIndex: number }
    >({
      mutationFn: (body) => createTemplateItemV2(templateId, body),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [ISSUE_TEMPLATES_V2] });
      },
    }),

  deleteItem: (templateId: string) =>
    mutationOptions<void, Error, string>({
      mutationFn: deleteTemplateItemV2,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [ISSUE_TEMPLATES_V2, 'detail', templateId],
        });
        queryClient.invalidateQueries({ queryKey: [ISSUE_TEMPLATES_V2, 'list'] });
      },
    }),
};
