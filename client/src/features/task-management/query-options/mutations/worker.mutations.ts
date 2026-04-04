import { createWorkerFile } from '@/apis/index.apis';
import queryClient from '@/config/query.client';
import { User } from '@/features/user-profile/types/auth.type';
import { PROCESS_DATA } from '@/features/employee-overview/consts/query-keys';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { FileResponse, SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import {
  applyIssueTemplateToWorker,
  createWorkerIssue,
  createWorkerTask,
  deleteWorkerFile,
  updateData,
  updateWorkerData,
  updateWorkerHistory,
  updateWorkerIssue,
  type CreateWorkerIssuePayload,
  type UpdateWorkerIssueBody,
} from '../../api/index.api';
import {
  FORMHISTORY,
  HISTORYDATA,
  ISSUE_AUDIT,
  WORKERBYID,
} from '../../consts/query-key.consts';
import {
  CreateWorkerTaskPayload,
  File_Request,
  InsertHistoryData,
  LifecycleType,
  UpdatePayload,
} from '../../types/index.types';

type UpdateTaskHistoryVariables = {
  formValues: InsertHistoryData;
  user: User;
};

export const workerMutations = {
  deleteWorker: (workerId: string | number) => {
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

  createFile: (id: string | number) => {
    return mutationOptions<FileResponse, Error, File[]>({
      mutationFn: (files: File[]) => createWorkerFile(files, id as number),
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

  updateTaskData: (
    workerId: string,
    lifecycleType: LifecycleType,
    closeSidebar: () => void
  ) => {
    return mutationOptions<void, Error, InsertHistoryData>({
      mutationFn: async (formValues) => {
        await updateWorkerData(formValues);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [WORKERBYID, workerId, lifecycleType],
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
          await queryClient.invalidateQueries({
            queryKey: [ALL_WORKER_DATA, 'detail', workerId],
          });
        },
      }
    );
  },

  createWorkerTask: (workerId: string | number, lifecycleType: LifecycleType) => {
    return mutationOptions<void, Error, CreateWorkerTaskPayload>({
      mutationFn: async (data) => {
        await createWorkerTask(workerId, data);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [WORKERBYID, workerId, lifecycleType],
        });
      },
    });
  },

  createWorkerIssue: (workerId: string) => {
    return mutationOptions<void, Error, CreateWorkerIssuePayload>({
      mutationFn: async (body) => {
        await createWorkerIssue(workerId, body);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [WORKERBYID, workerId],
        });
        await queryClient.invalidateQueries({
          queryKey: [PROCESS_DATA, workerId],
        });
      },
    });
  },

  updateWorkerIssue: (workerId: string) => {
    return mutationOptions<
      void,
      Error,
      { issueId: string; body: UpdateWorkerIssueBody }
    >({
      mutationFn: async ({ issueId, body }) => {
        await updateWorkerIssue(workerId, issueId, body);
      },
      onSuccess: async (_, { issueId }) => {
        await queryClient.invalidateQueries({
          queryKey: [WORKERBYID, workerId],
        });
        await queryClient.invalidateQueries({
          queryKey: [ISSUE_AUDIT, workerId, issueId],
        });
        await queryClient.invalidateQueries({
          queryKey: [PROCESS_DATA, workerId],
        });
      },
    });
  },

  applyIssueTemplate: (workerId: string) => {
    return mutationOptions<
      { count: number },
      Error,
      { templateId: string; workerEngagementId: string }
    >({
      mutationFn: async ({ templateId, workerEngagementId }) => {
        const res = await applyIssueTemplateToWorker(
          workerId,
          templateId,
          workerEngagementId
        );
        return res.data;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [WORKERBYID, workerId],
        });
      },
    });
  },
};
