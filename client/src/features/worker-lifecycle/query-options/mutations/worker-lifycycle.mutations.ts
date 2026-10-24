import queryClient from '@/config/query.client';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addWorker,
  archiveWorkerById,
  CreateWorkerRequest,
  deleteWorkerById,
  deleteWorkersByIds,
  unarchiveWorkerById,
} from '../../api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import { WorkerRecord, WorkerStatus } from '../../types/index.types';

type WorkerListSnapshot = {
  previous?: WorkerRecord[];
};

async function snapshotWorkers(): Promise<WorkerListSnapshot> {
  await queryClient.cancelQueries({ queryKey: [ALL_WORKER_DATA], exact: true });
  return {
    previous: queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA]),
  };
}

function restoreWorkers(context: WorkerListSnapshot | undefined) {
  if (context?.previous) {
    queryClient.setQueryData([ALL_WORKER_DATA], context.previous);
  }
}

function updateWorkerList(update: (workers: WorkerRecord[]) => WorkerRecord[]) {
  const workers = queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA]);
  if (!workers) return;
  queryClient.setQueryData([ALL_WORKER_DATA], update(workers));
}

function setWorkerStatus(workerId: string, status: WorkerStatus) {
  updateWorkerList((workers) =>
    workers.map((worker) =>
      worker.id === workerId ? { ...worker, status } : worker
    )
  );
}

export const workerLifecycleMutations = {
  deleteWorker: () => {
    return mutationOptions<void, Error, string, WorkerListSnapshot>({
      mutationFn: deleteWorkerById,
      onMutate: async (workerId) => {
        const snapshot = await snapshotWorkers();
        updateWorkerList((workers) =>
          workers.filter((worker) => worker.id !== workerId)
        );
        return snapshot;
      },
      onError: (_error, _workerId, context) => {
        restoreWorkers(context);
        toast.error('Handwerker konnte nicht gelöscht werden.');
      },
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: [ALL_WORKER_DATA],
          refetchType: 'active',
        });
      },
    });
  },

  deleteWorkers: () => {
    return mutationOptions<void, Error, string[], WorkerListSnapshot>({
      mutationFn: deleteWorkersByIds,
      onMutate: async (workerIds) => {
        const snapshot = await snapshotWorkers();
        const ids = new Set(workerIds);
        updateWorkerList((workers) =>
          workers.filter((worker) => !ids.has(worker.id))
        );
        return snapshot;
      },
      onError: (_error, _workerIds, context) => {
        restoreWorkers(context);
        toast.error('Handwerker konnten nicht gelöscht werden.');
      },
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: [ALL_WORKER_DATA],
          refetchType: 'active',
        });
      },
    });
  },

  addWorker: () => {
    return mutationOptions<
      { success: boolean; data: { worker: WorkerRecord } },
      Error,
      CreateWorkerRequest
    >({
      mutationFn: (data: CreateWorkerRequest) => addWorker(data),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [ALL_WORKER_DATA],
          refetchType: 'active',
        });
      },
      onError: (error) => {
        console.log(error);
      },
    });
  },

  archiveWorker: () => {
    return mutationOptions<void, Error, string, WorkerListSnapshot>({
      mutationFn: archiveWorkerById,
      onMutate: async (workerId) => {
        const snapshot = await snapshotWorkers();
        setWorkerStatus(workerId, 'inactive');
        return snapshot;
      },
      onError: (_error, _workerId, context) => {
        restoreWorkers(context);
        toast.error('Archivieren ist fehlgeschlagen.');
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    });
  },

  unarchiveWorker: () => {
    return mutationOptions<void, Error, string, WorkerListSnapshot>({
      mutationFn: unarchiveWorkerById,
      onMutate: async (workerId) => {
        const snapshot = await snapshotWorkers();
        setWorkerStatus(workerId, 'active');
        return snapshot;
      },
      onError: (_error, _workerId, context) => {
        restoreWorkers(context);
        toast.error('Wiederherstellen ist fehlgeschlagen.');
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    });
  },
};
