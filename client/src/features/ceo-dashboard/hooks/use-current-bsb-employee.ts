import { useMemo } from 'react';
import { TEmployForm } from '../types/employeeform.types';

function useCurrentBSBEmployee(
  allEmployeeData: TEmployForm | undefined,
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
