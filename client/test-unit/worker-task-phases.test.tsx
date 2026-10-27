import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import TaskManagement from '@/features/worker-task-management/components/tasks/WorkerTaskManagement';
import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';

const state = vi.hoisted(() => ({
  data: undefined as WorkerDetailResponse | undefined,
  create: vi.fn(),
}));
vi.mock('@/features/worker-task-management/hooks/useTaskData', () => ({
  default: () => ({ data: state.data, isLoading: false }),
}));
vi.mock('@/features/worker-task-management/hooks/useGetWorkerFiles', () => ({
  default: () => ({ fetchFiles: vi.fn() }),
}));
vi.mock('@/features/all-tasks/hooks/useTaskSidebar', () => ({
  useTaskSidebar: () => ({
    sidebarProps: { isOpen: false, taskEditState: {} },
    openForCreate: state.create,
  }),
}));
vi.mock('@/features/all-tasks/components/TaskSidebar', () => ({
  TaskSidebar: () => null,
}));
vi.mock('@/features/all-tasks/components/TaskItem', () => ({
  TaskItem: ({ task }: { task: { title: string } }) => (
    <tr>
      <td>{task.title}</td>
    </tr>
  ),
}));
vi.mock(
  '@/features/worker-task-management/components/tasks/TemplateApplyPrompt',
  () => ({
    TemplateApplyPrompt: ({
      targets,
    }: {
      targets: { engagementId: string }[];
    }) =>
      targets.length ? (
        <div data-testid="template-target">
          {targets.map((target) => target.engagementId).join(',')}
        </div>
      ) : null,
  })
);
vi.mock('@/features/worker-lifecycle/components/WorkerInformation', () => ({
  default: () => null,
}));
vi.mock(
  '@/features/worker-task-management/components/files/WorkerFileUploads',
  () => ({ default: () => null })
);
vi.mock(
  '@/features/worker-task-management/components/files/ContractSendDialog',
  () => ({ ContractSendDialog: () => null })
);
vi.mock(
  '@/features/worker-task-management/components/files/ContractConfirmDialog',
  () => ({ ContractConfirmDialog: () => null })
);
vi.mock(
  '@/features/worker-task-management/components/files/ArbeitszeugnisSendDialog',
  () => ({ ArbeitszeugnisSendDialog: () => null })
);
vi.mock('@/features/questionnaire/QuestionnaireSendDialog', () => ({
  QuestionnaireSendDialog: () => null,
}));
vi.mock(
  '@/features/worker-task-management/components/clothing/ClothingTab',
  () => ({ ClothingTab: () => null })
);
vi.mock(
  '@/features/worker-task-management/components/materials/MaterialsTab',
  () => ({ MaterialsTab: () => null })
);
vi.mock('@/features/all-tasks/components/LargeEditMode', () => ({
  LargeEditMode: () => null,
}));

const onboarding = {
  id: 'onboarding-1',
  type: 'onboarding',
  status: 'completed',
  issues: [{ id: 'task-1', title: 'Onboarding task', status: 'done' }],
};
const offboarding = {
  id: 'offboarding-1',
  type: 'offboarding',
  status: 'pending',
  issues: [],
};
function worker(engagements: unknown[]) {
  return {
    success: true,
    data: { id: 'worker-1', firstName: 'Ada', lastName: 'Test', engagements },
  } as WorkerDetailResponse;
}
beforeEach(() => {
  vi.clearAllMocks();
  state.data = worker([offboarding, onboarding]);
});

it('defaults to offboarding and scopes tasks, template selection and manual creation to the selected phase', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<TaskManagement workerId="worker-1" />);
  expect(screen.getByRole('tab', { name: 'Offboarding' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.queryByText('Onboarding task')).not.toBeInTheDocument();
  expect(screen.getByTestId('template-target')).toHaveTextContent(
    'offboarding-1'
  );
  await user.click(screen.getByRole('button', { name: 'Aufgabe hinzufügen' }));
  expect(state.create).toHaveBeenLastCalledWith({
    workerEngagementId: 'offboarding-1',
  });

  // A template creates tasks in the offboarding engagement and the query refreshes.
  state.data = worker([
    { ...offboarding, issues: [{ id: 'task-2', title: 'Offboarding task' }] },
    onboarding,
  ]);
  rerender(<TaskManagement workerId="worker-1" />);
  expect(screen.getByText('Offboarding task')).toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: 'Onboarding' }));
  expect(screen.getByText('Onboarding task')).toBeInTheDocument();
  expect(screen.queryByText('Offboarding task')).not.toBeInTheDocument();
  expect(screen.queryByTestId('template-target')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Aufgabe hinzufügen' }));
  expect(state.create).toHaveBeenLastCalledWith({
    workerEngagementId: 'onboarding-1',
  });
});

it('shows the toggle and defaults to offboarding when the type changes while mounted', () => {
  state.data = worker([onboarding]);
  const { rerender } = render(<TaskManagement workerId="worker-1" />);
  expect(
    screen.queryByRole('tab', { name: 'Offboarding' })
  ).not.toBeInTheDocument();
  expect(screen.getByText('Onboarding task')).toBeInTheDocument();
  state.data = worker([offboarding, onboarding]);
  rerender(<TaskManagement workerId="worker-1" />);
  expect(screen.getByRole('tab', { name: 'Offboarding' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.getByTestId('template-target')).toHaveTextContent(
    'offboarding-1'
  );
});

it('hides the offboarding template picker when leaving Aufgaben', async () => {
  const user = userEvent.setup();
  render(<TaskManagement workerId="worker-1" />);
  await user.click(screen.getByRole('button', { name: 'Dateien' }));
  expect(screen.queryByTestId('template-target')).not.toBeInTheDocument();
});
