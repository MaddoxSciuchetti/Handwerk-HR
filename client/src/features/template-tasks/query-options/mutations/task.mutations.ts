import queryClient from '@/config/query.client';
import type { TaskSubmission } from '@/features/task-management/types/index.types';
import { mutationOptions } from '@tanstack/react-query';
import { createTemplateTask } from '../../api';
import { DESCRIPTION_ROOT } from '../../consts/query-key.consts';

export type CreateTemplateTaskParams = {
  templateId: string;
  data: TaskSubmission;
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
};
