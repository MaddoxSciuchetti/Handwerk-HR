import queryClient from '@/config/query.client';
import { SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import { deleteTemplateTask } from '../../api';
import { DESCRIPTION_ROOT } from '../../consts/query-key.consts';

export const templateMutations = {
  delete: () => {
    return mutationOptions<SuccessResponse<string>, Error, number>({
      mutationFn: deleteTemplateTask,
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: [DESCRIPTION_ROOT] }),
    });
  },
};
