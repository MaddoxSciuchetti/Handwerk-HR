import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { adminQueries } from '../query-options/queries/admin.queries';
import { EmployeeWorker } from '../types/employeeform.types';

function useEmployeeData() {
  const { data, isLoading } = useQuery<EmployeeWorker>(
    adminQueries.EmployeeWorker()
  );

  const tasksByEmployee = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, EmployeeWorker>();

    for (const item of data) {
      const filtered = {
        ...item,
        issues: item.issues.filter((issue) => {
          const statusName = issue.issueStatus.name.toLowerCase();
          return (
            !statusName.includes('erledigt') &&
            !statusName.includes('done') &&
            !statusName.includes('closed')
          );
        }),
      };
      if (filtered.issues.length === 0) continue;

      const ownerId = item.responsibleUser.id;
      const group = groups.get(ownerId) ?? [];
      group.push(filtered);
      groups.set(ownerId, group);
    }

    return Array.from(groups.entries());
  }, [data]);

  const openTaskCountsByEmployee = useMemo(() => {
    return new Map(
      tasksByEmployee.map(([ownerId, items]) => {
        const totalOpenTasks = items.reduce(
          (count, item) => count + item.issues.length,
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
