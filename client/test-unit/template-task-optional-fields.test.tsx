import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { TemplateTaskItem } from '@/features/template-tasks/components/TemplateTaskItem';
import { EMPTY_TEMPLATE_TASK } from '@/features/template-tasks/schemas/templateTaskForm.schema';
import { useSubmitTasks } from '@/features/worker-task-management/hooks/useSubmitTasks';

const api = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));
vi.mock('@/features/template-tasks/api', () => ({
  createTemplateTask: api.create,
  updateTemplateTask: api.update,
  deleteTemplateTask: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

it.each(['create', 'edit'] as const)(
  'saves a task with no description or responsible person in %s mode',
  async (mode) => {
    const values = {
      ...EMPTY_TEMPLATE_TASK,
      taskId: 'task',
      taskName: 'Welcome',
    };
    const { result } = renderHook(
      () => useSubmitTasks('task', 'template', mode, values),
      { wrapper }
    );
    await act(async () => {
      await result.current.onSubmit();
    });
    await waitFor(() =>
      expect(mode === 'create' ? api.create : api.update).toHaveBeenCalledWith(
        expect.objectContaining({
          taskDescription: '',
          defaultAssigneeUserId: '',
        }),
        mode === 'create' ? 'template' : 'task'
      )
    );
    expect(result.current.errors).toEqual({});
  }
);

it('opens a task with null database values as empty form fields', () => {
  const setEditTemplateTask = vi.fn();
  render(
    <table>
      <tbody>
        <TemplateTaskItem
          templateTasks={[
            {
              id: 'task',
              taskName: 'Welcome',
              taskDescription: null,
              defaultAssigneeUserId: null,
              defaultStatus: 'open',
              orderIndex: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]}
          setEditTemplateTask={setEditTemplateTask}
          setIsOpen={vi.fn()}
          setTemplateTaskState={vi.fn()}
        />
      </tbody>
    </table>,
    { wrapper }
  );
  fireEvent.click(screen.getByRole('button', { name: 'Aufgabe bearbeiten' }));
  expect(setEditTemplateTask).toHaveBeenCalledWith(
    expect.objectContaining({
      taskDescription: '',
      defaultAssigneeUserId: '',
    })
  );
});
