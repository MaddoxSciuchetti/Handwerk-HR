import queryClient from '@/config/query.client';
import { mutationOptions } from '@tanstack/react-query';
import { addWorker, deleteWorkerById } from '../../api';
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
};
