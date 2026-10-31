import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { TaskSidebar } from '@/features/all-tasks/components/TaskSidebar';
import { EMPTY_TASK_EDIT_STATE } from '@/features/all-tasks/hooks/useTaskSidebar';
import type { TaskSidebarForm } from '@/features/all-tasks/types/index.types';

const { flushAutoSave } = vi.hoisted(() => ({ flushAutoSave: vi.fn() }));
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({ data: [] }),
}));
vi.mock('@/features/settings/mail-template/useMailTemplates', () => ({
  useMailTemplates: () => ({ data: [] }),
}));
vi.mock('@/features/all-tasks/hooks/useFetchEngagements', () => ({
  useFetchEngagements: () => ({ data: [] }),
}));
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { id: 'me' } }),
}));
vi.mock('@/features/all-tasks/hooks/useTasks', () => ({
  useTasks: () => {
    const form = useForm<TaskSidebarForm>({
      defaultValues: {
        title: 'Arbeitsvertrag drucken',
        workerEngagementId: 'engagement',
        assigneeUserId: '',
        status: 'open',
        automation: 'none',
        sequence: 'none',
      },
    });
    return {
      ...form,
      errors: {},
      flushAutoSave,
      saveManually: vi.fn(),
      isTaskSaving: false,
      autoSaveState: 'idle',
    };
  },
}));
vi.mock('@/features/all-tasks/components/TaskChat', () => ({
  TaskChat: ({ taskId }: { taskId: string }) => (
    <textarea aria-label="Nachricht" data-task-id={taskId} />
  ),
}));
vi.mock(
  '@/features/worker-task-management/components/tasks/task-sidebar/task-history/TaskHistory',
  () => ({ default: () => null })
);

beforeEach(() => {
  vi.clearAllMocks();
  flushAutoSave.mockResolvedValue(true);
});

function renderSidebar(
  onOpenContract?: () => void,
  taskState: 'create' | 'edit' = 'edit'
) {
  return render(
    <TaskSidebar
      isOpen
      setIsOpen={vi.fn()}
      taskState={taskState}
      taskEditState={{
        ...EMPTY_TASK_EDIT_STATE,
        taskId: 'contract-task',
        title: 'Arbeitsvertrag drucken',
        workerEngagementId: 'engagement',
      }}
      onOpenContract={onOpenContract}
    />
  );
}

it('keeps messages available and opens the contract only from its button', async () => {
  const openContract = vi.fn();
  const user = userEvent.setup();
  renderSidebar(openContract);
  expect(openContract).not.toHaveBeenCalled();
  const message = screen.getByRole('textbox', { name: 'Nachricht' });
  expect(message).toHaveAttribute('data-task-id', 'contract-task');
  await user.type(message, 'Bitte den Vertrag prüfen');
  await user.click(
    screen.getByRole('button', { name: 'Arbeitsvertrag öffnen' })
  );
  expect(flushAutoSave).toHaveBeenCalledOnce();
  expect(openContract).toHaveBeenCalledOnce();
  expect(message).toHaveValue('Bitte den Vertrag prüfen');
});

it('keeps the task open when pending changes cannot be saved', async () => {
  flushAutoSave.mockResolvedValue(false);
  const openContract = vi.fn();
  renderSidebar(openContract);
  await userEvent.click(
    screen.getByRole('button', { name: 'Arbeitsvertrag öffnen' })
  );
  expect(openContract).not.toHaveBeenCalled();
  expect(screen.getByRole('textbox', { name: 'Nachricht' })).toBeVisible();
});

it.each(['standard', 'create'])(
  'hides the contract button for %s tasks',
  (type) => {
    renderSidebar(
      type === 'create' ? vi.fn() : undefined,
      type === 'create' ? 'create' : 'edit'
    );
    expect(
      screen.queryByRole('button', { name: 'Arbeitsvertrag öffnen' })
    ).not.toBeInTheDocument();
  }
);
