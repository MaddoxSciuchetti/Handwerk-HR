import queryClient from '@/config/query.client';
import { mutationOptions } from '@tanstack/react-query';
import {
  addWorker,
  archiveWorkerById,
  deleteWorkerById,
  unarchiveWorkerById,
} from '../../api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import { CreateWorker } from '../../schemas/zod.schemas';
import { WorkerRecord } from '../../types/index.types';

export const workerLifecycleMutations = {
  deleteWorker: () => {
    return mutationOptions<void, Error, string>({
      mutationFn: deleteWorkerById,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [ALL_WORKER_DATA],
          refetchType: 'all',
        });
      },
    });
  },

  addWorker: () => {
    return mutationOptions<WorkerRecord, Error, CreateWorker>({
      mutationFn: (data: CreateWorker) => addWorker(data),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [ALL_WORKER_DATA],
          refetchType: 'all',
        });
      },
      onError: (error) => {
        console.log(error);
      },
    });
  },

  archiveWorker: () => {
    return mutationOptions<void, Error, string>({
      mutationFn: archiveWorkerById,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    });
  },

  unarchiveWorker: () => {
    return mutationOptions<void, Error, string>({
      mutationFn: unarchiveWorkerById,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    });
  },
};
