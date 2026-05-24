import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { adminQueries } from '../query-options/queries/admin.queries';
import { IssueData, WorkerEngagement } from '../schemas/employeeform.schemas';
import { EmployeeWorker } from '../types/employeeform.types';

const CLOSED_STATUSES = new Set<IssueData['status']>(['done', 'cancelled']);

const isOpenIssue = (issue: IssueData) => !CLOSED_STATUSES.has(issue.status);

function groupOpenTasksByAssignee(data: EmployeeWorker) {
  const groups = new Map<string, Map<string, WorkerEngagement>>();

  for (const engagement of data) {
    for (const issue of engagement.issues) {
      if (!isOpenIssue(issue)) continue;

      const assigneeId = issue.assignee?.id;
      if (!assigneeId) continue;

      const engagementsByAssignee =
        groups.get(assigneeId) ?? new Map<string, WorkerEngagement>();
      const groupedEngagement = engagementsByAssignee.get(engagement.id);

      if (!groupedEngagement) {
        engagementsByAssignee.set(engagement.id, {
          ...engagement,
          issues: [issue],
        });
        groups.set(assigneeId, engagementsByAssignee);
        continue;
      }

      groupedEngagement.issues.push(issue);
    }
  }

  return Array.from(groups.entries()).map(
    ([assigneeId, engagementsByAssignee]) =>
      [assigneeId, Array.from(engagementsByAssignee.values())] as const
  );
}

function useEmployeeData() {
  const { data, isLoading } = useQuery<EmployeeWorker>(
    adminQueries.EmployeeWorker()
  );

  const tasksByEmployee = useMemo<Array<[string, WorkerEngagement[]]>>(() => {
    if (!data) return [];
    return groupOpenTasksByAssignee(data);
  }, [data]);

  const openTaskCountsByEmployee = useMemo(() => {
    return new Map(
      tasksByEmployee.map(([ownerId, engagements]) => {
        const totalOpenTasks = engagements.reduce(
          (count, engagement) => count + engagement.issues.length,
          0
        );
        return [ownerId, totalOpenTasks] as const;
      })
    );
  }, [tasksByEmployee]);

  return {
    isLoading,
    tasksByEmployee,
    openTaskCountsByEmployee,
  };
}

export default useEmployeeData;
