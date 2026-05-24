import { createWorkerFile } from '@/apis/index.apis';
import queryClient from '@/config/query.client';
import { User } from '@/features/user-profile/types/auth.type';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { FileResponse, SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import {
  createWorkerTask,
  deleteWorkerFile,
  updateData,
  updateWorkerData,
  updateWorkerHistory,
} from '../../api/index.api';
import {
  FORMHISTORY,
  HISTORYDATA,
  WORKERBYID,
} from '../../consts/query-key.consts';
import {
  CreateWorkerTaskPayload,
  File_Request,
  InsertHistoryData,
  UpdatePayload,
} from '../../types/index.types';

type UpdateTaskHistoryVariables = {
  formValues: InsertHistoryData;
  user: User;
};

export const workerMutations = {
  deleteWorker: (workerId: string) => {
    return mutationOptions<SuccessResponse<string>, Error, string>({
      mutationFn: (fileId: string) => deleteWorkerFile(workerId, fileId),
      onMutate: async (fileId) => {
        await queryClient.cancelQueries({ queryKey: [HISTORYDATA, workerId] });

        queryClient.setQueryData<File_Request[]>(
          [HISTORYDATA, workerId],
          (old) => old?.filter((file) => file.id !== fileId) || []
        );
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: [HISTORYDATA, workerId] });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [HISTORYDATA, workerId] });
      },
    });
  },

  createFile: (id: string) => {
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

  updateTaskData: (workerId: string, closeSidebar: () => void) => {
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

  updateDataPoint: (workerId: string) => {
    return mutationOptions<void, unknown, UpdatePayload, { previous: unknown }>(
      {
        mutationFn: async (data) => {
          await updateData(data, workerId);
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: [ALL_WORKER_DATA],
          });
        },
      }
    );
  },

  createWorkerTask: (workerId: string) => {
    return mutationOptions<void, Error, CreateWorkerTaskPayload>({
      mutationFn: async (data) => {
        await createWorkerTask(workerId, data);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [WORKERBYID, workerId],
        });
      },
    });
  },
};
