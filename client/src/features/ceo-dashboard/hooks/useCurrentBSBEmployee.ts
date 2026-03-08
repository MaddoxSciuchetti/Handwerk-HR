import { useMemo } from 'react';
import { EmployeeWorker } from '../types/employeeform.types';

function useCurrentBSBEmployee(
  allEmployeeData: EmployeeWorker | undefined,
  selectedUser: string | null
) {
  const currentBSBEmployee = useMemo(
    () => allEmployeeData?.filter((item) => item.owner === selectedUser) || [],
    [selectedUser, allEmployeeData]
  );

  return {
    currentBSBEmployee,
  };
}

export default useCurrentBSBEmployee;
