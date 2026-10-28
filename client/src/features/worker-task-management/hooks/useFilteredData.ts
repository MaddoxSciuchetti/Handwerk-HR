import { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import { useMemo } from 'react';

type WorkerEngagement = WorkerDetailResponse['data']['engagements'][number];
export type WorkerIssue = Omit<
  NonNullable<WorkerEngagement['issues']>[number],
  'workerEngagementId'
> & { workerEngagementId: string };

const flattenEngagementIssues = (
  data: WorkerDetailResponse | undefined
): WorkerIssue[] =>
  data?.data.engagements.flatMap((engagement) =>
    (engagement.issues ?? []).map((issue) => ({
      ...issue,
      workerEngagementId: engagement.id,
      workerEngagement: {
        workerId: data.data.id,
        templateApplication: engagement.templateApplication ?? null,
        worker: {
          firstName: data.data.firstName,
          lastName: data.data.lastName,
        },
      },
    }))
  ) ?? [];

function useFilteredData(data: WorkerDetailResponse | undefined) {
  const displayData = useMemo(() => flattenEngagementIssues(data), [data]);

  return { displayData };
}

export default useFilteredData;
