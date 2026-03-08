import queryClient from '@/config/query.client';
import { NewDescriptionField, SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import {
  createTemplateTask,
  deleteTemplateTask,
  updateTemplateTask,
} from '../../api';
import { DESCRIPTION_ROOT } from '../../consts/query-key.consts';
import { EditDescriptionData } from '../../types/taskForm.types';

export const templateMutations = {
  delete: () => {
    return mutationOptions<SuccessResponse<string>, Error, number>({
      mutationFn: deleteTemplateTask,
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: [DESCRIPTION_ROOT] }),
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
