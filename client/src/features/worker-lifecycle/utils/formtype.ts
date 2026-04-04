import { LifecycleType } from '@/features/task-management/types/index.types';
import {
  EngagementType,
  WorkerRecord,
} from '@/features/worker-lifecycle/types/index.types';

const engagementTypeToLifecycleType = (
  type: EngagementType | undefined
): LifecycleType => {
  if (type === 'offboarding') return 'offboarding';
  return 'onboarding';
};

export const getFirstFormType = (item: WorkerRecord): LifecycleType => {
  return engagementTypeToLifecycleType(item.engagements[0]?.type);
};
