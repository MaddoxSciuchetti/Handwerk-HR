import { cn } from '@/lib/utils';
import type { WorkerRecord } from '../types/index.types';
import {
  getWorkerHealth,
  workerHealthClassName,
} from '../utils/workerHealth.utils';

type WorkerHealthCellProps = {
  worker: WorkerRecord;
  className?: string;
};

export function WorkerHealthCell({ worker, className }: WorkerHealthCellProps) {
  const health = getWorkerHealth(worker);

  if (health.totalCount === 0) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>—</span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        workerHealthClassName(health.level),
        className
      )}
      title={`${health.percentage}% der Aufgaben erledigt`}
    >
      {health.doneCount}/{health.totalCount}
    </span>
  );
}
