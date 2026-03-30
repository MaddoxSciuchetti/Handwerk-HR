import { useMemo } from 'react';
import { EmployeeWorker } from '../types/employeeform.types';

function useEmployeeGroups(
  user: string,
  tasksByEmployee: Array<[string, EmployeeWorker]>
) {
  const employeeGroups = useMemo(() => {
    const ownerItems = tasksByEmployee.find(([ownerId]) => ownerId === user)?.[1] ?? [];

    const groupedByWorker = new Map<
      string,
      {
        employee: {
          id: string;
          vorname: string;
          nachname: string;
          email: string | null;
        };
        inputs: Array<{
          description: string;
          timestamp: Date;
          lastChangedAt: Date;
          form_field_id: number;
          status: string;
        }>;
      }
    >();

    ownerItems.forEach((engagement) => {
      const workerId = engagement.worker.id;
      const current = groupedByWorker.get(workerId) ?? {
        employee: {
          id: workerId,
          vorname: engagement.worker.firstName,
          nachname: engagement.worker.lastName,
          email: engagement.worker.email,
        },
        inputs: [],
      };

      engagement.issues.forEach((issue, index) => {
        current.inputs.push({
          description: issue.title,
          timestamp: issue.createdAt,
          lastChangedAt: issue.updatedAt,
          form_field_id: index + 1,
          status: issue.issueStatus.name,
        });
      });

      groupedByWorker.set(workerId, current);
    });

    return Array.from(groupedByWorker.entries())
      .filter(([, group]) => group.inputs.length > 0);
  }, [tasksByEmployee, user]);

  const totalOpenTasks = useMemo(
    () =>
      employeeGroups.reduce(
        (total, [, group]) => total + group.inputs.length,
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
