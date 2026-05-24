import type { IssueStatusValue } from '@/features/all-tasks/consts/issue-status.consts';
import type { WorkerRecord } from '../types/index.types';

export type WorkerHealthLevel = 'green' | 'orange' | 'red' | 'neutral';

export type WorkerHealth = {
  doneCount: number;
  totalCount: number;
  percentage: number | null;
  level: WorkerHealthLevel;
};

function collectWorkerIssues(worker: WorkerRecord) {
  return worker.engagements.flatMap((engagement) => engagement.issues ?? []);
}

export function getWorkerHealth(worker: WorkerRecord): WorkerHealth {
  const issues = collectWorkerIssues(worker);
  const totalCount = issues.length;

  if (totalCount === 0) {
    return {
      doneCount: 0,
      totalCount: 0,
      percentage: null,
      level: 'neutral',
    };
  }

  const doneCount = issues.filter(
    (issue) => (issue.status as IssueStatusValue) === 'done'
  ).length;
  const percentage = Math.round((doneCount / totalCount) * 100);

  let level: WorkerHealthLevel = 'red';
  if (percentage === 100) {
    level = 'green';
  } else if (percentage >= 50) {
    level = 'orange';
  }

  return {
    doneCount,
    totalCount,
    percentage,
    level,
  };
}

export function workerHealthClassName(level: WorkerHealthLevel): string {
  switch (level) {
    case 'green':
      return 'bg-(--status-success-bg) text-(--status-success-foreground)';
    case 'orange':
      return 'bg-(--status-warning-bg) text-(--status-warning-foreground)';
    case 'red':
      return 'bg-(--status-error-bg) text-(--status-error-foreground)';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
