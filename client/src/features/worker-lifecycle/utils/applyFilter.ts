import type { EngagementType, WorkerRecord } from '../types/index.types';

export function applyFilter(
  workers: WorkerRecord[],
  types: EngagementType[]
): WorkerRecord[] {
  return workers.filter((worker) => {
    const current = worker.engagements[0];
    return current && types.includes(current.type);
  });
}

export function applyFilterAndSort(
  workers: WorkerRecord[],
  types: EngagementType[]
): WorkerRecord[] {
  return applyFilter(workers, types).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}
