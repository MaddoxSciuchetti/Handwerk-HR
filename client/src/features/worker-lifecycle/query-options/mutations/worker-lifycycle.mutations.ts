import queryClient from '@/config/query.client';
import { mutationOptions } from '@tanstack/react-query';
import {
  addWorker,
  archiveWorkerById,
  deleteWorkerById,
  unarchiveWorkerById,
} from '../../api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import { AddWorker } from '../../schemas/zod.schemas';
import { DeleteUser, ItemUser } from '../../types/index.types';

export const workerLifecycleMutations = {
  deleteWorker: () => {
    return mutationOptions<DeleteUser, Error, number>({
      mutationFn: deleteWorkerById,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    });
  },

  addWorker: () => {
    return mutationOptions<ItemUser, Error, AddWorker>({
      mutationFn: (data: AddWorker) => addWorker(data),
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
    return mutationOptions<ItemUser, Error, number>({
      mutationFn: archiveWorkerById,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    });
  },

  unarchiveWorker: () => {
    return mutationOptions<ItemUser, Error, number>({
      mutationFn: unarchiveWorkerById,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    });
  },
};
