import { useMemo } from 'react';
import { EmployeeWorker } from '../types/employeeform.types';

function useHandwerkerProBSBEmployee(
  allEmployeeData: EmployeeWorker | undefined
) {
  return useMemo(() => {
    if (!allEmployeeData) return [];
    const ownerToEngagementMap = new Map<string, EmployeeWorker[number]>();
    allEmployeeData.forEach((item) => {
      const ownerId = item.responsibleUser.id;
      if (!ownerToEngagementMap.has(ownerId)) {
        ownerToEngagementMap.set(ownerId, item);
      }
    });
    return Array.from(ownerToEngagementMap.values());
  }, [allEmployeeData]);
}

export default useHandwerkerProBSBEmployee;
