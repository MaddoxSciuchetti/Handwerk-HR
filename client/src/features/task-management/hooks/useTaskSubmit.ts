import useAuth from '@/features/user-profile/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { workerMutations } from '../query-options/mutations/worker.mutations';
import { InsertHistoryData } from '../types/index.types';

function useTaskSubmit(id: number) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const closeSidebar = () => setSelectedTaskId(null);
  const { user } = useAuth();
  const { mutateAsync: updateTaskHistory } = useMutation(
    workerMutations.updateTaskHistory()
  );
  const { mutateAsync: updateTaskData } = useMutation(
    workerMutations.updateTaskData(id, closeSidebar)
  );

  async function handleSubmit(formValues: InsertHistoryData) {
    if (!user) {
      return;
    }
    await updateTaskHistory({ formValues, user });
    await updateTaskData(formValues);
  }

  return {
    handleSubmit,
    setSelectedTaskId,
    selectedTaskId,
  };
}

export default useTaskSubmit;
