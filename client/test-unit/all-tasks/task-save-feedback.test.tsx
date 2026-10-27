import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useTasks } from '@/features/all-tasks/hooks/useTasks';
import { EMPTY_TASK_EDIT_STATE } from '@/features/all-tasks/hooks/useTaskSidebar';

const { updateTask } = vi.hoisted(() => ({ updateTask: vi.fn() }));
vi.mock('@/features/all-tasks/hooks/useFetchEngagements', () => ({
  useFetchEngagements: () => ({ data: [] }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/all-tasks/hooks/useCreateTask', () => ({
  useCreateTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/features/all-tasks/hooks/useUpdateTask', () => ({
  useUpdateTask: () => ({ mutateAsync: updateTask, isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  updateTask.mockResolvedValue({});
});

function setup() {
  return renderHook(() =>
    useTasks(
      { ...EMPTY_TASK_EDIT_STATE, taskId: 'task-1', title: 'Before' },
      'edit',
      vi.fn(),
      { autoSave: true }
    )
  );
}

it('confirms a manual save only after the pending update succeeds', async () => {
  let finish!: () => void;
  updateTask.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  const { result } = setup();
  act(() => result.current.setValue('title', 'After'));
  let saving!: Promise<boolean>;
  await act(async () => {
    saving = result.current.saveManually();
  });
  expect(updateTask).toHaveBeenCalledOnce();
  expect(toast.success).not.toHaveBeenCalled();
  await act(async () => {
    finish();
    expect(await saving).toBe(true);
  });
  expect(toast.success).toHaveBeenCalledExactlyOnceWith('Aufgabe gespeichert');
});

it('confirms clicking Save when there are no pending changes', async () => {
  const { result } = setup();
  await act(async () => {
    expect(await result.current.saveManually()).toBe(true);
  });
  expect(updateTask).not.toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalledExactlyOnceWith('Aufgabe gespeichert');
});

it.each(['failed', 'invalid'])('does not confirm a %s save', async (reason) => {
  const { result } = setup();
  if (reason === 'failed')
    updateTask.mockRejectedValueOnce(new Error('Offline'));
  act(() =>
    result.current.setValue('title', reason === 'invalid' ? '' : 'After')
  );
  await act(async () => {
    expect(await result.current.saveManually()).toBe(false);
  });
  expect(toast.success).not.toHaveBeenCalled();
});

it('keeps closing and background flushes quiet', async () => {
  const { result } = setup();
  act(() => result.current.setValue('title', 'After'));
  await act(async () => {
    expect(await result.current.flushAutoSave()).toBe(true);
  });
  expect(updateTask).toHaveBeenCalledOnce();
  expect(toast.success).not.toHaveBeenCalled();
});
