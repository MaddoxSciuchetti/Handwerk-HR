import { createWorkerFile } from '@/apis/index.apis';
import queryClient from '@/config/query.client';
import { FileResponse, SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import { deleteWorkerFile } from '../../api/index.api';
import { HISTORYDATA } from '../../consts/query-key.consts';
import { File_Request } from '../../types/index.types';

export const workerMutations = {
  deleteWorker: (workerId: number) => {
    return mutationOptions<SuccessResponse<string>, Error, number>({
      mutationFn: (fileId: number) => deleteWorkerFile(fileId),
      onMutate: async (fileId) => {
        await queryClient.cancelQueries({ queryKey: [HISTORYDATA, workerId] });

        queryClient.setQueryData<File_Request[]>(
          [HISTORYDATA, workerId],
          (old) => old?.filter((file) => file.id !== fileId) || []
        );
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: [HISTORYDATA, workerId] });
        console.log('this is the invalidation number');
      },
    });
  },

  createFile: (id: number) => {
    return mutationOptions<FileResponse, Error, File[]>({
      mutationFn: (files: File[]) => createWorkerFile(files, id),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [HISTORYDATA, id],
        });
      },
      onError: (error) => {
        console.log(error);
      },
    });
  },
};
