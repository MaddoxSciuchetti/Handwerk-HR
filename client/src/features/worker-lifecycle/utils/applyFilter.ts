import type {
  EngagementType,
  WorkerRecord,
  WorkerTypeFilterValue,
} from '../types/index.types';

export function applyFilter(
  workers: WorkerRecord[],
  types: WorkerTypeFilterValue[]
): WorkerRecord[] {
  const includeArchived = types.includes('archived');
  const activeTypes = types.filter(
    (type): type is EngagementType => type !== 'archived'
  );
  return workers.filter((worker) => {
    if (worker.status === 'inactive') return includeArchived;
    const current = worker.engagements[0];
    return current && activeTypes.includes(current.type);
  });
}

export function applyFilterAndSort(
  workers: WorkerRecord[],
  types: WorkerTypeFilterValue[]
): WorkerRecord[] {
  return applyFilter(workers, types).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}
