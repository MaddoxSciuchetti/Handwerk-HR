import { useMemo } from 'react';
import { TEmployeeForm } from '../types/employeeform.types';

function useCurrentBSBEmployee(
  allEmployeeData: TEmployeeForm | undefined,
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
