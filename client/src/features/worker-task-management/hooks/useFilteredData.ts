import { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import { useMemo } from 'react';

type WorkerEngagement = WorkerDetailResponse['data']['engagements'][number];
export type WorkerIssue = NonNullable<WorkerEngagement['issues']>[number];

const flattenEngagementIssues = (
  data: WorkerDetailResponse | undefined
): WorkerIssue[] =>
  data?.data.engagements.flatMap((engagement) => engagement.issues ?? []) ?? [];

function useFilteredData(data: WorkerDetailResponse | undefined) {
  const allIssues = useMemo(() => flattenEngagementIssues(data), [data]);

  return {
    displayData: allIssues,
  };
}

export default useFilteredData;
