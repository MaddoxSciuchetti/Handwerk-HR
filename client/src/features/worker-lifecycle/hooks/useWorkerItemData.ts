import { useState } from 'react';
import { calculatePercent } from '../utils/percentCalculation';

function useWorkerItemData(
  completedTasksCount: number | null,
  totalTasks: number | null
) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const completedCount = completedTasksCount ?? 0;
  const totalCount = totalTasks ?? 0;
  const color = calculatePercent(completedCount, totalCount);

  return {
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isInfoModalOpen,
    setIsInfoModalOpen,
    completedCount,
    totalCount,
    color,
  };
}

export default useWorkerItemData;
