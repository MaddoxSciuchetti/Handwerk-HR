import useAuth from '@/features/user-profile/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { workerMutations } from '../query-options/mutations/worker.mutations';
import { InsertHistoryData, LifecycleType } from '../types/index.types';

function useTaskSubmit(workerId: string, lifecycleType: LifecycleType) {
  const [selectedTaskId, setSelectedTaskId] = useState<
    string | number | null
  >(null);
  const closeSidebar = () => setSelectedTaskId(null);
  const { user } = useAuth();
  const { mutateAsync: updateTaskHistory } = useMutation(
    workerMutations.updateTaskHistory()
  );
  const { mutateAsync: updateTaskData } = useMutation(
    workerMutations.updateTaskData(workerId, lifecycleType, closeSidebar)
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
