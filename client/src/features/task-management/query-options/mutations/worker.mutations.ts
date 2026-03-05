import queryClient from '@/config/query.client';
import { SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import { deleteWorkerFile } from '../../api/index.api';
import { HISTORYDATA } from '../../consts/query-key.consts';
import { File_Request } from '../../types/index.types';

export const workerMutations = {
  deleteWorker: (id: number) => {
    return mutationOptions<Pick<SuccessResponse, 'success'>, Error, number>({
      mutationFn: (fileId: number) => deleteWorkerFile(fileId),
      onMutate: async (fileId) => {
        await queryClient.cancelQueries({ queryKey: [HISTORYDATA, id] });

        queryClient.setQueryData<File_Request[]>(
          [HISTORYDATA, id],
          (old) => old?.filter((file) => file.id !== fileId) || []
        );
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: [HISTORYDATA, id] });
        console.log('this is the invalidation number');
      },
    });
  },
};
