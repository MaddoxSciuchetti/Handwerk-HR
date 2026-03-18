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
        inputs: item.inputs.filter((i) => i.status !== 'erledigt'),
      };
      const group = groups.get(item.owner) ?? [];
      group.push(filtered);
      groups.set(item.owner, group);
    }

    return Array.from(groups.entries());
  }, [data]);

  const openTaskCountsByEmployee = useMemo(() => {
    return new Map(
      tasksByEmployee.map(([owner, items]) => {
        const totalOpenTasks = items.reduce(
          (count, item) => count + item.inputs.length,
          0
        );
        return [owner, totalOpenTasks] as const;
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
