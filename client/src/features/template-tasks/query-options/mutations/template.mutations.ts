import queryClient from '@/config/query.client';
import { NewDescriptionField, SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import {
  createTemplateTask,
  createTemplateTaskV2,
  deleteTemplateTask,
  updateTemplateTask,
} from '../../api';
import {
  DESCRIPTION_ROOT,
  TEMPLATES_LIST_ROOT,
} from '../../consts/query-key.consts';
import { TemplateSubmission } from '../../hooks/useSubmitTemplate';
import { EditDescriptionData } from '../../types/taskForm.types';

export const templateMutations = {
  delete: () => {
    return mutationOptions<SuccessResponse<string>, Error, string>({
      mutationFn: (id: string) => deleteTemplateTask(id),
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: [TEMPLATES_LIST_ROOT] }),
    });
  },

  update: () => {
    return mutationOptions<EditDescriptionData, Error, EditDescriptionData>({
      mutationFn: updateTemplateTask,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [DESCRIPTION_ROOT] });
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

  create: () => {
    return mutationOptions<
      NewDescriptionField,
      Error,
      {
        description: string;
        template_type: 'ONBOARDING' | 'OFFBOARDING';
        owner: string;
      }
    >({
      mutationFn: createTemplateTask,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [DESCRIPTION_ROOT] });
      },
    });
  },
};
