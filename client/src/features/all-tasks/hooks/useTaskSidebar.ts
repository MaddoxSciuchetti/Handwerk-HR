import { useCallback, useState } from 'react';

export type TaskEditState = {
  taskId: string;
  title: string;
  workerEngagementId: string;
  assigneeUserId: string;
  statusId: string;
};

export const EMPTY_TASK_EDIT_STATE: TaskEditState = {
  taskId: '',
  title: '',
  workerEngagementId: '',
  assigneeUserId: '',
  statusId: '',
};

export function useTaskSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [taskState, setTaskState] = useState<'create' | 'edit'>('create');
  const [taskEditState, setTaskEditState] = useState<TaskEditState>(
    EMPTY_TASK_EDIT_STATE
  );
  const [createOpenNonce, setCreateOpenNonce] = useState(0);

  const openForEdit = useCallback((seed: TaskEditState) => {
    setTaskState('edit');
    setTaskEditState(seed);
    setIsOpen(true);
  }, []);

  const openForCreate = useCallback(() => {
    setTaskState('create');
    setTaskEditState(EMPTY_TASK_EDIT_STATE);
    setCreateOpenNonce((n) => n + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const sidebarKey =
    taskState === 'edit'
      ? `edit-${taskEditState.taskId}`
      : `create-${createOpenNonce}`;

  return {
    sidebarKey,
    sidebarProps: { isOpen, setIsOpen, taskState, taskEditState },
    openForEdit,
    openForCreate,
    close,
  };
}
