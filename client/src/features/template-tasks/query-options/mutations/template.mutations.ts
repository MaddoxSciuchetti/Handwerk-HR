import queryClient from '@/config/query.client';
import { SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import {
  createTemplateTaskV2,
  deleteTemplate,
  updateTemplate,
  UpdateTemplateParams,
} from '../../api';
import { TEMPLATES_LIST_ROOT } from '../../consts/query-key.consts';
import { TemplateSubmission } from '../../hooks/useSubmitTemplate';

export const templateMutations = {
  delete: () => {
    return mutationOptions<SuccessResponse<string>, Error, string>({
      mutationFn: (id: string) => deleteTemplate(id),
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: [TEMPLATES_LIST_ROOT] }),
    });
  },

  update: () => {
    return mutationOptions<TemplateSubmission, Error, UpdateTemplateParams>({
      mutationFn: ({ data, templateId }) =>
        updateTemplate({ data, templateId }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [TEMPLATES_LIST_ROOT] });
      },
    });
  },

  createTemplate: () => {
    return mutationOptions<TemplateSubmission, Error, TemplateSubmission>({
      mutationFn: createTemplateTaskV2,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [TEMPLATES_LIST_ROOT] });
      },
    });
  },
};
