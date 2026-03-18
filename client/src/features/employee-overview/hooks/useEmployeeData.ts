import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { adminQueries } from '../query-options/queries/admin.queries';
import { EmployeeWorker } from '../types/employeeform.types';

function useEmployeeData() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error } = useQuery<EmployeeWorker>(
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

  const openTaskCountsByOwner = useMemo(() => {
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
    data,
    selectedUser,
    setSelectedUser,
    modal: isModalOpen,
    setModalOpen: setIsModalOpen,
    isLoading,
    error,
    cleanData: tasksByEmployee,
    openTaskCountsByOwner,
  };
}

export default useEmployeeData;
