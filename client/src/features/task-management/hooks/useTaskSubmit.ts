import useAuth from '@/features/user-profile/hooks/useAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { workerMutations } from '../query-options/mutations/worker.mutations';
import { workerQueries } from '../query-options/queries/worker.queries';
import { InsertHistoryData, LifecycleType } from '../types/index.types';
import { TaskStatus } from '../utils/selectOptionTernary';
import { isV2IssueId } from './useTaskHistory';

const ORG_STATUS_NAME: Record<TaskStatus, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Arbeit',
  erledigt: 'Erledigt',
};

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

  const { data: statuses = [] } = useQuery(
    workerQueries.issueStatuses(workerId)
  );

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
      const taskStatus = formValues.select_option as TaskStatus;
      const statusName = ORG_STATUS_NAME[taskStatus];
      const statusId = statuses.find((s) => s.name === statusName)?.id;
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
