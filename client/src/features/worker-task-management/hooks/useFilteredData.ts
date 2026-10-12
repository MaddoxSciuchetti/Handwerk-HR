import { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import { confirmationTasksFirst } from '@/features/all-tasks/utilts/task-order.utils';
import { useMemo } from 'react';

type WorkerEngagement = WorkerDetailResponse['data']['engagements'][number];
export type WorkerIssue = NonNullable<WorkerEngagement['issues']>[number];

const flattenEngagementIssues = (
  data: WorkerDetailResponse | undefined
): WorkerIssue[] =>
  data?.data.engagements.flatMap((engagement) => engagement.issues ?? []) ?? [];

function useFilteredData(data: WorkerDetailResponse | undefined) {
  const displayData = useMemo(
    () => confirmationTasksFirst(flattenEngagementIssues(data)),
    [data]
  );

  return { displayData };
}

export default useFilteredData;
