import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useSubmitTasks } from '@/features/worker-task-management/hooks/useSubmitTasks';
import { EMPTY_TEMPLATE_TASK } from '@/features/template-tasks/schemas/templateTaskForm.schema';

const api = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));
vi.mock('@/features/template-tasks/api', () => ({
  createTemplateTask: api.create,
  updateTemplateTask: api.update,
  deleteTemplateTask: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function setup(mode: 'create' | 'edit') {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return renderHook(
    () =>
      useSubmitTasks('task', 'template', mode, {
        ...EMPTY_TEMPLATE_TASK,
        taskId: 'task',
        taskName: 'Welcome',
        defaultAssigneeUserId: 'admin',
        integrationProvider: 'microsoft_graph',
        sequence: 'microsoft_send_teams_message',
        mailTemplateId: 'empty-template',
      }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );
}

beforeEach(() => vi.resetAllMocks());

it.each(['create', 'edit'] as const)(
  'explains an empty Teams template when saving in %s mode',
  async (mode) => {
    const message = 'Bitte eine Nachrichtenvorlage mit Inhalt wählen.';
    api.create.mockRejectedValue({ status: 400, message });
    api.update.mockRejectedValue({ status: 400, message });
    const { result } = setup(mode);
    await act(async () => {
      await result.current.onSubmit();
    });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(message);
      expect(result.current.errors.mailTemplateId?.message).toBe(message);
    });
    expect(mode === 'create' ? api.create : api.update).toHaveBeenCalled();
  }
);

it('shows other server validation reasons without blaming the selected template', async () => {
  api.update.mockRejectedValue({
    status: 400,
    message: 'Diese Integration ist nicht aktiv.',
  });
  const { result } = setup('edit');
  await act(async () => {
    await result.current.onSubmit();
  });
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      'Diese Integration ist nicht aktiv.'
    )
  );
  expect(result.current.errors.mailTemplateId).toBeUndefined();
});

it('keeps a fallback when the server supplies no message', async () => {
  api.update.mockRejectedValue({ status: 500 });
  const { result } = setup('edit');
  await act(async () => {
    await result.current.onSubmit();
  });
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      'Aufgabe konnte nicht gespeichert werden'
    )
  );
});

it('can save again after the message template content is corrected', async () => {
  api.update
    .mockRejectedValueOnce({
      status: 400,
      message: 'Bitte eine Nachrichtenvorlage mit Inhalt wählen.',
    })
    .mockResolvedValueOnce({});
  const { result } = setup('edit');
  await act(async () => {
    await result.current.onSubmit();
  });
  await waitFor(() =>
    expect(result.current.errors.mailTemplateId).toBeDefined()
  );
  await act(async () => {
    await result.current.onSubmit();
  });
  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith('Aufgabe gespeichert')
  );
  expect(result.current.errors.mailTemplateId).toBeUndefined();
});
