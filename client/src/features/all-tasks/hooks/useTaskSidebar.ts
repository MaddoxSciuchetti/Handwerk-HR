import { useCallback, useState } from 'react';
import type { IssueStatusValue } from '../consts/issue-status.consts';
import {
  TASK_AUTOMATION_NONE,
  type TaskAutomationValue,
} from '../consts/task-automation.consts';

export type TaskEditState = {
  taskId: string;
  title: string;
  workerEngagementId: string;
  assigneeUserId: string;
  status: IssueStatusValue | '';
  automation: TaskAutomationValue;
};

export const EMPTY_TASK_EDIT_STATE: TaskEditState = {
  taskId: '',
  title: '',
  workerEngagementId: '',
  assigneeUserId: '',
  status: '',
  automation: TASK_AUTOMATION_NONE,
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

  const openForCreate = useCallback((seed?: Partial<TaskEditState>) => {
    setTaskState('create');
    setTaskEditState({ ...EMPTY_TASK_EDIT_STATE, ...seed, taskId: '' });
    setCreateOpenNonce((n) => n + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const patchTaskEditState = useCallback(
    (patch: Partial<TaskEditState>) => {
      setTaskEditState((prev) => ({ ...prev, ...patch }));
    },
    []
  );

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
    patchTaskEditState,
  };
}
