import queryClient from '@/config/query.client';
import { EMPLOYEE_SPECIFICS } from '@/features/employee-overview/consts/query-keys';
import type { OrgUsersArray } from '@/features/employee-overview/schemas/schema';
import type { OrgStatusRow } from '@/features/org-settings/api/orgStatus.api';
import { ORG_STATUSES } from '@/features/org-settings/consts/query-key.consts';
import { mutationOptions } from '@tanstack/react-query';
import {
  addWorker,
  archiveWorkerById,
  deleteWorkerById,
  unarchiveWorkerById,
} from '../../api';
import {
  updateWorkerEngagement,
  type UpdateEngagementBody,
} from '../../api/engagement.api';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';
import { CreateWorker } from '../../schemas/zod.schemas';
import type {
  WorkerDetailResponse,
  WorkerEngagement,
  WorkerRecord,
} from '../../types/index.types';

const invalidateWorkers = (all?: boolean) =>
  queryClient.invalidateQueries({
    queryKey: [ALL_WORKER_DATA],
    ...(all ? { refetchType: 'all' as const } : {}),
  });

/** Applies team lead / status ids from cache for optimistic UI. */
function patchEngagement(
  e: WorkerEngagement,
  engagementId: string,
  body: UpdateEngagementBody,
  users: OrgUsersArray | undefined,
  statuses: OrgStatusRow[] | undefined
): WorkerEngagement {
  if (e.id !== engagementId) return e;
  const n = { ...e };
  if (body.responsibleUserId !== undefined) {
    const u = users?.find((x) => x.id === body.responsibleUserId);
    n.responsibleUser = u
      ? {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
        }
      : { ...n.responsibleUser, id: body.responsibleUserId };
  }
  if (body.statusId !== undefined) {
    const s = statuses?.find((x) => x.id === body.statusId);
    n.engagementStatus = s
      ? { id: s.id, name: s.name, color: s.color }
      : { ...n.engagementStatus, id: body.statusId };
  }
  return n;
}

export const workerLifecycleMutations = {
  deleteWorker: () =>
    mutationOptions<void, Error, string>({
      mutationFn: deleteWorkerById,
      onSuccess: () => invalidateWorkers(true),
    }),

  addWorker: () =>
    mutationOptions<WorkerRecord, Error, CreateWorker>({
      mutationFn: addWorker,
      onSuccess: () => invalidateWorkers(true),
      onError: (e) => console.log(e),
    }),

  archiveWorker: () =>
    mutationOptions<void, Error, string>({
      mutationFn: archiveWorkerById,
      onSuccess: () => invalidateWorkers(),
    }),

  unarchiveWorker: () =>
    mutationOptions<void, Error, string>({
      mutationFn: unarchiveWorkerById,
      onSuccess: () => invalidateWorkers(),
    }),

  updateEngagement: (workerId: string) =>
    mutationOptions<
      void,
      Error,
      { engagementId: string; body: UpdateEngagementBody },
      {
        previousList: WorkerRecord[] | undefined;
        previousDetail: WorkerDetailResponse | undefined;
      }
    >({
      mutationFn: ({ engagementId, body }) =>
        updateWorkerEngagement(workerId, engagementId, body),
      onMutate: async ({ engagementId, body }, { client }) => {
        await client.cancelQueries({ queryKey: [ALL_WORKER_DATA] });
        const listKey = [ALL_WORKER_DATA] as const;
        const detailKey = [ALL_WORKER_DATA, 'detail', workerId] as const;

        const previousList = client.getQueryData<WorkerRecord[]>(listKey);
        const previousDetail =
          client.getQueryData<WorkerDetailResponse>(detailKey);
        const users = client.getQueryData<OrgUsersArray>([EMPLOYEE_SPECIFICS]);
        const statuses = client.getQueryData<OrgStatusRow[]>([
          ORG_STATUSES,
          'engagement',
        ]);
        const p = (e: WorkerEngagement) =>
          patchEngagement(e, engagementId, body, users, statuses);

        client.setQueryData<WorkerRecord[]>(listKey, (old) =>
          old?.map((w) =>
            w.id === workerId ? { ...w, engagements: w.engagements.map(p) } : w
          )
        );

        client.setQueryData<WorkerDetailResponse>(detailKey, (old) =>
          !old?.data
            ? old
            : {
                ...old,
                data: {
                  ...old.data,
                  engagements: old.data.engagements.map((e) => ({
                    ...e,
                    ...p(e),
                  })),
                },
              }
        );

        return { previousList, previousDetail };
      },
      onError: (_e, _v, snap, { client }) => {
        if (snap?.previousList !== undefined)
          client.setQueryData([ALL_WORKER_DATA], snap.previousList);
        if (snap?.previousDetail !== undefined)
          client.setQueryData(
            [ALL_WORKER_DATA, 'detail', workerId],
            snap.previousDetail
          );
      },
      onSettled: (_d, _e, _v, _s, { client }) => {
        client.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    }),
};
