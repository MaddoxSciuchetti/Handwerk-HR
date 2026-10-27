import { engagementsForTaskPhase } from './taskPhase';
import type { WorkerRecord } from '../types/index.types';

export type WorkerHealthLevel = 'green' | 'orange' | 'red' | 'neutral';

export type WorkerHealth = {
  doneCount: number;
  totalCount: number;
  percentage: number | null;
  level: WorkerHealthLevel;
};

function collectWorkerIssueCounts(worker: Pick<WorkerRecord, 'engagements'>) {
  return engagementsForTaskPhase(worker.engagements).flatMap(
    (engagement) =>
      engagement.issueCounts ??
      (engagement.issues ?? []).map((issue) => ({
        status: issue.status,
        count: 1,
      }))
  );
}

export function getWorkerIssueCount(
  worker: Pick<WorkerRecord, 'engagements'>
): number {
  return collectWorkerIssueCounts(worker).reduce(
    (total, issue) =>
      total + (issue.status === 'not_applicable' ? 0 : issue.count),
    0
  );
}

export function getWorkerHealth(
  worker: Pick<WorkerRecord, 'engagements'>
): WorkerHealth {
  const counts = collectWorkerIssueCounts(worker).filter(
    (issue) => !['cancelled', 'not_applicable'].includes(issue.status)
  );
  const totalCount = counts.reduce((total, issue) => total + issue.count, 0);

  if (totalCount === 0) {
    return { doneCount: 0, totalCount: 0, percentage: null, level: 'neutral' };
  }

  const doneCount = counts.reduce(
    (total, issue) => total + (issue.status === 'done' ? issue.count : 0),
    0
  );
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
