import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import DropdownActionTrigger from '@/components/DropdownActionTrigger';
import useFetchProcessData from '@/features/employee-overview/hooks/useFetchProcessData';
import { LifecycleType } from '@/features/task-management/types/index.types';
import '../../../../globals.css';
import useWorkerItemData from '../hooks/useWorkerItemData';
import useWorkerMutations from '../hooks/useWorkerMutaitons';
import { EngagementStatus, WorkerRecord } from '../types/index.types';
import { getFirstFormType } from '../utils/formtype';
import WorkerInfoModal from './WorkerInfoModal';
import WorkerItemInfo from './WorkerItemInfo';
import { WorkerEngagementControls } from './worker-row/WorkerEngagementControls';

type WorkerItemProps = {
  worker: WorkerRecord;
  engagementStatus: EngagementStatus;
  gotopage: (
    taskId: string,
    form_type: LifecycleType,
    workerName: string
  ) => void;
};

export function Worker_Item({
  worker,
  engagementStatus,
  gotopage,
}: WorkerItemProps) {
  const form_type = getFirstFormType(worker);
  const {
    isLoading: processLoading,
    completedTasksCount,
    totalTasks,
  } = useFetchProcessData(worker.id);

  const { archiveWorkerMutation, deleteTaskMutation, unarchiveWorkerMutation } =
    useWorkerMutations();

  const {
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isInfoModalOpen,
    setIsInfoModalOpen,
    completedCount,
    totalCount,
    color,
  } = useWorkerItemData(completedTasksCount, totalTasks);

  return (
    <tr className="group rounded-2xl transition-colors">
      <td className="align-middle px-2 py-4 text-center text-sm">
        {/* Responsibile for Info and Ansehen Button */}
        <WorkerItemInfo
          setIsInfoModalOpen={setIsInfoModalOpen}
          gotopage={gotopage}
          workerId={worker.id}
          form_type={form_type}
          worker={worker}
        />
      </td>
      <td className="min-w-[12rem] max-w-[24rem] align-middle px-2 py-4 text-center">
        {/* Controlls who is the team lead and what the current status is */}
        <WorkerEngagementControls
          workerId={worker.id}
          engagement={worker.engagements[0]}
        />
      </td>
      {/* Controlls type onboardinf or offboarding */}
      <td
        className={
          form_type === 'onboarding'
            ? 'px-2 py-4 text-center align-middle text-sm text-[var(--lifecycle-onboarding-text)] underline'
            : 'px-2 py-4 text-center align-middle text-sm text-[var(--lifecycle-offboarding-text)] underline'
        }
        lang="en"
      >
        {form_type === 'offboarding' ? 'Offboarding' : 'Onboarding'}
      </td>

      {/* Controlls the number of completed tasks */}
      <td className="px-2 py-4 text-center align-middle tabular-nums">
        <span className={color}>{processLoading ? '...' : completedCount}</span>
        <span className="font-medium text-foreground">/{totalCount}</span>
      </td>

      {/* Controlls the actions like archive, delete, info */}
      <td className="px-2 py-4 text-center align-middle">
        <div className="flex justify-center">
          <DropdownActionTrigger
            description="Aktionen"
            disabled={false}
            triggerIcon="more"
            actions={[
              {
                label:
                  engagementStatus === 'active'
                    ? 'Archivieren'
                    : 'Wiederherstellen',
                action: () =>
                  engagementStatus === 'active'
                    ? archiveWorkerMutation(worker.id)
                    : unarchiveWorkerMutation(worker.id),
                variant: 'default',
              },
              {
                label: 'Löschen',
                action: () => setIsDeleteModalOpen(true),
                variant: 'destructive',
              },
            ]}
          />
        </div>
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            deleteTaskMutation(worker.id);
            setIsDeleteModalOpen(false);
          }}
        />
        <WorkerInfoModal
          isOpen={isInfoModalOpen}
          workerId={worker.id}
          onClose={() => setIsInfoModalOpen(false)}
        />
      </td>
    </tr>
  );
}
