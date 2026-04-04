import useAuth from '@/features/user-profile/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { workerMutations } from '../query-options/mutations/worker.mutations';
import { InsertHistoryData, LifecycleType } from '../types/index.types';
import { isV2IssueId } from './useTaskHistory';

function useTaskSubmit(
  workerId: string,
  lifecycleType: LifecycleType,
  engagementId: string
) {
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
  const { mutateAsync: patchWorkerIssue } = useMutation(
    workerMutations.updateWorkerIssue(workerId)
  );

  async function handleSubmit(formValues: InsertHistoryData) {
    if (!user) {
      return;
    }

    const issueId = String(formValues.id);
    if (isV2IssueId(issueId)) {
      const statusId = formValues.select_option;
      if (!statusId) return;
      await patchWorkerIssue({
        issueId,
        body: {
          workerEngagementId: engagementId,
          statusId,
          description: formValues.editcomment || undefined,
        },
      });
      closeSidebar();
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
