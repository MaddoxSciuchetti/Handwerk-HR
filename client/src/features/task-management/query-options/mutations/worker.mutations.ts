import { createWorkerFile } from '@/apis/index.apis';
import queryClient from '@/config/query.client';
import { User } from '@/features/user-profile/types/auth.type';
import { FileResponse, SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import {
  deleteWorkerFile,
  updateWorkerData,
  updateWorkerHistory,
} from '../../api/index.api';
import { FORMHISTORY, HISTORYDATA, WORKERBYID } from '../../consts/query-key.consts';
import { File_Request, InsertHistoryData } from '../../types/index.types';

type UpdateTaskHistoryVariables = {
  formValues: InsertHistoryData;
  user: User;
};

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

  updateTaskHistory: () => {
    return mutationOptions<void, Error, UpdateTaskHistoryVariables>({
      mutationFn: async ({ formValues, user }) => {
        await updateWorkerHistory(formValues, user);
      },
      onSuccess: async (_, { formValues }) => {
        await queryClient.invalidateQueries({
          queryKey: [FORMHISTORY, parseInt(formValues.id, 10)],
        });
      },
    });
  },

  updateTaskData: (workerId: number, closeSidebar: () => void) => {
    return mutationOptions<void, Error, InsertHistoryData>({
      mutationFn: async (formValues) => {
        await updateWorkerData(formValues);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [WORKERBYID, workerId],
        });
        closeSidebar();
      },
    });
  },
};
