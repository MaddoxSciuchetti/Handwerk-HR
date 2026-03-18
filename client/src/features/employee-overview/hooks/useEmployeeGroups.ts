import { useMemo } from 'react';
import { EmployeeWorker } from '../types/employeeform.types';

function useEmployeeGroups(
  user: string,
  tasksByEmployee: Array<[string, EmployeeWorker]>
) {
  const employeeGroups = useMemo(() => {
    const ownerItems =
      tasksByEmployee.find(([owner]) => owner === user)?.[1] ?? [];

    const groupedByHandwerker = new Map<
      number,
      {
        employee: {
          id: number;
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

    ownerItems.forEach((task) => {
      task.inputs.forEach((input) => {
        const current = groupedByHandwerker.get(input.employee.id);

        if (!current) {
          groupedByHandwerker.set(input.employee.id, {
            employee: input.employee,
            inputs: [
              {
                description: task.description,
                timestamp: input.timestamp,
                lastChangedAt: input.lastChangedAt,
                form_field_id: task.form_field_id,
                status: input.status,
              },
            ],
          });
          return;
        }

        current.inputs.push({
          description: task.description,
          timestamp: input.timestamp,
          lastChangedAt: input.lastChangedAt,
          form_field_id: task.form_field_id,
          status: input.status,
        });
      });
    });

    return Array.from(groupedByHandwerker.entries())
      .map(([employeeId, group]) => [String(employeeId), group] as const)
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
