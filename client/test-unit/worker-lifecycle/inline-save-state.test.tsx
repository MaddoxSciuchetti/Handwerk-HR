import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import WorkerLifeCycle from '@/features/worker-lifecycle/components/WorkerLifecycle';

const { switchType, changeResponsible } = vi.hoisted(() => ({
  switchType: vi.fn(),
  changeResponsible: vi.fn(),
}));
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { id: 'user', firstName: 'Test' } }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useHome', () => ({
  default: () => ({ workers: [], toggleModal: vi.fn() }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useWorkerMutaitons', () => ({
  default: () => ({ deleteWorkersMutation: vi.fn(), isDeletingWorkers: false }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useSwitchEngagementType', () => ({
  useSwitchEngagementType: () => ({ mutateAsync: switchType }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useChangeResponsibleUser', () => ({
  useChangeResponsibleUser: () => ({ mutateAsync: changeResponsible }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useWorkerFilter', () => ({
  useWorkerFilter: () => ({
    employees: [],
    selectedTypes: ['onboarding'],
    toggleType: vi.fn(),
    filteredWorkers: ['one', 'two'].map((id) => ({
      id,
      engagements: [
        {
          id: `phase-${id}`,
          type: 'onboarding',
          responsibleUser: { id: 'old' },
        },
      ],
    })),
  }),
}));
vi.mock('@/hooks/useBodyScrollLock', () => ({ useBodyScrollLock: vi.fn() }));
vi.mock('@/features/worker-lifecycle/components/GreetingHeader', () => ({
  default: () => null,
}));
vi.mock('@/features/worker-lifecycle/components/WorkerSidebar', () => ({
  WorkerSidebar: () => null,
}));
vi.mock('@/features/worker-lifecycle/components/LifeCycleModal', () => ({
  default: () => null,
}));
vi.mock(
  '@/features/worker-lifecycle/components/WorkerSelectAllCheckbox',
  () => ({ WorkerSelectAllCheckbox: () => null })
);
vi.mock('@/features/worker-lifecycle/components/ProjectItem', () => ({
  default: ({
    worker,
    isChangingType,
    isChangingResponsible,
    onTypeChange,
    onResponsibleChange,
  }: {
    worker: { id: string };
    isChangingType: boolean;
    isChangingResponsible: boolean;
    onTypeChange: (type: string) => void;
    onResponsibleChange: (userId: string) => void;
  }) => (
    <tr>
      <td>
        <button
          disabled={isChangingType}
          onClick={() => onTypeChange('offboarding')}
        >
          Type {worker.id}
        </button>
        <button
          disabled={isChangingResponsible}
          onClick={() => onResponsibleChange('new')}
        >
          Responsible {worker.id}
        </button>
      </td>
    </tr>
  ),
}));

beforeEach(() => vi.resetAllMocks());

it('keeps other fields and workers editable and queues a same-worker edit against the saved phase', async () => {
  let finishType!: (value: unknown) => void;
  switchType.mockReturnValue(
    new Promise((resolve) => {
      finishType = resolve;
    })
  );
  changeResponsible.mockResolvedValue({ data: { id: 'saved-phase' } });
  render(<WorkerLifeCycle />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Type one' }));
  expect(screen.getByRole('button', { name: 'Type one' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Responsible one' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Type two' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Responsible one' }));
  expect(
    screen.getByRole('button', { name: 'Responsible one' })
  ).toBeDisabled();
  expect(changeResponsible).not.toHaveBeenCalled();
  await act(async () => finishType([{ data: { id: 'saved-phase' } }]));
  await waitFor(() =>
    expect(changeResponsible).toHaveBeenCalledExactlyOnceWith({
      workerId: 'one',
      engagementId: 'saved-phase',
      userId: 'new',
    })
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Type one' })).toBeEnabled()
  );
  expect(screen.getByRole('button', { name: 'Responsible one' })).toBeEnabled();
});

it('allows another worker to save and clears only the failed field state', async () => {
  let failType!: (reason: Error) => void;
  switchType.mockReturnValue(
    new Promise((_resolve, reject) => {
      failType = reject;
    })
  );
  changeResponsible.mockResolvedValue({ data: { id: 'phase-two' } });
  render(<WorkerLifeCycle />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Type one' }));
  await user.click(screen.getByRole('button', { name: 'Responsible two' }));
  expect(changeResponsible).toHaveBeenCalledExactlyOnceWith({
    workerId: 'two',
    engagementId: 'phase-two',
    userId: 'new',
  });
  expect(screen.getByRole('button', { name: 'Type one' })).toBeDisabled();
  await act(async () => failType(new Error('failed')));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Type one' })).toBeEnabled()
  );
});
