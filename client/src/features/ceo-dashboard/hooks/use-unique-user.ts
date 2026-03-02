import { useMemo } from 'react';
import { EmployeeWorker } from '../types/employeeform.types';

function useHandwerkerProBSBEmployee(
  allEmployeeData: EmployeeWorker | undefined
) {
  return useMemo(() => {
    if (!allEmployeeData) return [];
    const ownerToUserMap = new Map<string, EmployeeWorker[0]>();
    allEmployeeData.forEach((item) => {
      if (!ownerToUserMap.has(item.owner)) {
        ownerToUserMap.set(item.owner, item);
      }
    });
    return Array.from(ownerToUserMap.values());
  }, [allEmployeeData]);
}

export default useHandwerkerProBSBEmployee;
