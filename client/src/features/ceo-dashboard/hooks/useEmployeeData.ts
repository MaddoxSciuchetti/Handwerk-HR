import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { adminQueries } from '../query-options/queries/admin.queries';
import { EmployeeWorker } from '../types/employeeform.types';

function useEmployeeData() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [modal, setModalOpen] = useState<boolean>(false);
  const {
    data: allEmployeeData,
    isLoading,
    error,
  } = useQuery<EmployeeWorker>(adminQueries.EmployeeWorker());

  const cleanData = useMemo(() => {
    if (!allEmployeeData) return [];
    const groups = new Map<string, EmployeeWorker>();
    allEmployeeData.forEach((item) => {
      if (!groups.has(item.owner)) {
        groups.set(item.owner, []);
      }
    });

    groups.forEach((_, key) => {
      const originalInputs = allEmployeeData
        .filter((item) => item.owner === key)
        .map((item) => ({
          ...item,
          inputs: item.inputs.filter((input) => input.status !== 'erledigt'),
        }));
      groups.set(key, originalInputs);
    });
    return Array.from(groups.entries());
  }, [allEmployeeData]);

  return {
    allEmployeeData,
    selectedUser,
    setSelectedUser,
    modal,
    setModalOpen,
    isLoading,
    error,
    cleanData,
  };
}

export default useEmployeeData;
