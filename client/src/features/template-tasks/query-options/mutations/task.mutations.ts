import queryClient from '@/config/query.client';

import { TemplateTaskFormValues } from '@/features/worker-task-management/types/index.types';
import { SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import {
  createTemplateTask,
  deleteTemplateTask,
  updateTemplateTask,
} from '../../api';
import { DESCRIPTION_ROOT } from '../../consts/query-key.consts';

export type CreateTemplateTaskParams = {
  templateId: string;
  data: TemplateTaskFormValues;
};

export type UpdateTemplateTaskParams = {
  taskId: string;
  data: TemplateTaskFormValues;
};

export const taskMutations = {
  createTask: () => {
    return mutationOptions<
      Awaited<ReturnType<typeof createTemplateTask>>,
      Error,
      CreateTemplateTaskParams
    >({
      mutationFn: ({ templateId, data }) =>
        createTemplateTask(data, templateId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [DESCRIPTION_ROOT] });
      },
    });
  },

  deleteTask: () => {
    return mutationOptions<SuccessResponse<string>, Error, string>({
      mutationFn: (id: string) => deleteTemplateTask(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [DESCRIPTION_ROOT] });
      },
    });
  },

  updateTask: () => {
    return mutationOptions<
      TemplateTaskFormValues,
      Error,
      UpdateTemplateTaskParams
    >({
      mutationFn: ({ taskId, data }) => updateTemplateTask(data, taskId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [DESCRIPTION_ROOT] });
      },
    });
  },
};
