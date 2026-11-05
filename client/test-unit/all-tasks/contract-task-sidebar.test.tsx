import { screen } from '@testing-library/react';
import { renderWithProviders } from 'test-unit/test-utils';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { TaskSidebar } from '@/features/all-tasks/components/TaskSidebar';
import {
  EMPTY_TASK_EDIT_STATE,
  type TaskEditState,
} from '@/features/all-tasks/hooks/useTaskSidebar';
import type { TaskSidebarForm } from '@/features/all-tasks/types/index.types';

const { flushAutoSave, integrations } = vi.hoisted(() => ({
  flushAutoSave: vi.fn(),
  integrations: [
    { provider: 'microsoft_graph', enabled: true },
    { provider: 'crewmeister', enabled: true },
  ],
}));
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey.includes('integrations') ? integrations : [],
  }),
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
  useTasks: (task: TaskEditState) => {
    const form = useForm<TaskSidebarForm>({
      defaultValues: {
        title: task.title,
        workerEngagementId: 'engagement',
        assigneeUserId: '',
        status: 'open',
        automation: 'none',
        sequence: task.sequence || 'none',
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
vi.mock('@/features/all-tasks/components/TaskAutomation', () => ({
  default: () => null,
}));
vi.mock(
  '@/features/worker-task-management/components/tasks/task-sidebar/task-history/TaskHistory',
  () => ({ default: () => null })
);

beforeEach(() => {
  vi.clearAllMocks();
  flushAutoSave.mockResolvedValue(true);
  integrations.forEach((integration) => {
    integration.enabled = true;
  });
});

function renderSidebar(
  onOpenContract?: () => void,
  taskState: 'create' | 'edit' = 'edit',
  seed: Partial<TaskEditState> = {}
) {
  return renderWithProviders(
    <TaskSidebar
      isOpen
      setIsOpen={vi.fn()}
      taskState={taskState}
      taskEditState={{
        ...EMPTY_TASK_EDIT_STATE,
        taskId: 'contract-task',
        title: 'Arbeitsvertrag drucken',
        workerEngagementId: 'engagement',
        ...seed,
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

it('selects the automation provider before offering only its types', async () => {
  const user = userEvent.setup();
  renderSidebar(undefined, 'create');
  expect(screen.queryByText('Typ')).not.toBeInTheDocument();
  await user.click(screen.getByRole('combobox', { name: 'Automatisierung' }));
  expect(
    screen.queryByRole('option', { name: /Microsoft ·/ })
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('option', { name: 'Microsoft', exact: true })
  );
  expect(screen.getByPlaceholderText('Titel')).toHaveValue('Microsoft');
  await user.click(document.getElementById('sequence')!);
  expect(
    screen.queryByRole('option', { name: 'Mitgliedschaft entfernen' })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: 'Konto anlegen' }));
  expect(screen.getByPlaceholderText('Titel')).toHaveValue(
    'Microsoft: Konto anlegen'
  );

  await user.click(screen.getByRole('combobox', { name: 'Automatisierung' }));
  await user.click(
    screen.getByRole('option', { name: 'Crewmeister', exact: true })
  );
  expect(document.getElementById('sequence')).toHaveTextContent('Typ wählen');
  await user.click(document.getElementById('sequence')!);
  expect(
    screen.queryByRole('option', { name: 'E-Mail senden' })
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('option', { name: 'Mitgliedschaft entfernen' })
  );
  expect(screen.getByPlaceholderText('Titel')).toHaveValue(
    'Crewmeister: Mitgliedschaft entfernen'
  );

  await user.click(screen.getByRole('combobox', { name: 'Automatisierung' }));
  await user.click(screen.getByRole('option', { name: 'Keine', exact: true }));
  expect(screen.queryByText('Typ')).not.toBeInTheDocument();
});

it('preserves a saved system automation when its provider is disabled', () => {
  integrations[0].enabled = false;
  renderSidebar(undefined, 'edit', {
    sequence: 'microsoft_assign_access_groups',
    integrationProvider: 'microsoft_graph',
  });
  expect(
    screen.getByRole('combobox', { name: 'Automatisierung' })
  ).toHaveTextContent('Microsoft');
  expect(document.getElementById('sequence')).toHaveTextContent(
    'Gruppenrechte zuweisen'
  );
  expect(screen.getByPlaceholderText('Titel')).toHaveValue(
    'Arbeitsvertrag drucken'
  );
});
