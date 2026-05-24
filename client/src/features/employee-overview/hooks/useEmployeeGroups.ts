import { useMemo } from 'react';
import {
  EngagementWorker,
  IssueData,
  WorkerEngagement,
} from '../schemas/employeeform.schemas';

export type WorkerIssueGroup = {
  worker: EngagementWorker;
  issues: IssueData[];
};

function useEmployeeGroups(
  user: string,
  tasksByEmployee: Array<[string, WorkerEngagement[]]>
) {
  const employeeGroups = useMemo(() => {
    const ownerEngagements =
      tasksByEmployee.find(([ownerId]) => ownerId === user)?.[1] ?? [];

    const groupedByWorker = new Map<string, WorkerIssueGroup>();

    for (const engagement of ownerEngagements) {
      const existing = groupedByWorker.get(engagement.worker.id);

      if (!existing) {
        groupedByWorker.set(engagement.worker.id, {
          worker: engagement.worker,
          issues: [...engagement.issues],
        });
        continue;
      }

      existing.issues.push(...engagement.issues);
    }

    return Array.from(groupedByWorker.entries()).filter(
      ([, group]) => group.issues.length > 0
    );
  }, [tasksByEmployee, user]);

  const totalOpenTasks = useMemo(
    () =>
      employeeGroups.reduce(
        (total, [, group]) => total + group.issues.length,
        0
      ),
    [employeeGroups]
  );
  const hasNoOpenTasks = totalOpenTasks === 0;

  return {
    employeeGroups,
    totalOpenTasks,
    hasNoOpenTasks,
  };
}

export default useEmployeeGroups;
