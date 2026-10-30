import type {
  EngagementType,
  WorkerTypeFilterValue,
} from '../types/index.types';

export const ENGAGEMENT_TYPE_OPTIONS: {
  label: string;
  value: EngagementType;
}[] = [
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Offboarding', value: 'offboarding' },
  { label: 'Team', value: 'transfer' },
];

export const WORKER_TYPE_FILTER_OPTIONS: {
  label: string;
  value: WorkerTypeFilterValue;
}[] = [
  ...ENGAGEMENT_TYPE_OPTIONS,
  { label: 'Archiv', value: 'archived' },
];

export const DEFAULT_WORKER_TYPE_FILTER: WorkerTypeFilterValue[] =
  ENGAGEMENT_TYPE_OPTIONS.map((option) => option.value);

export function switchableEngagementTypes(selectedTypes: EngagementType[]) {
  const unique = new Set(selectedTypes);
  if (unique.size !== 1) return ENGAGEMENT_TYPE_OPTIONS;
  return ENGAGEMENT_TYPE_OPTIONS.filter((option) => !unique.has(option.value));
}
