import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkerLifeCycle from '@/features/worker-lifecycle/components/WorkerLifecycle';

const { deleteWorkersMutation, filterState } = vi.hoisted(() => ({
  filterState: { isTeamMode: false },
  deleteWorkersMutation: vi.fn(),
}));
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { firstName: 'Test' } }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useHome', () => ({
  default: () => ({ workers: [], toggleModal: vi.fn() }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useWorkerMutaitons', () => ({
  default: () => ({ deleteWorkersMutation, isDeletingWorkers: false }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useSwitchEngagementType', () => ({
  useSwitchEngagementType: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useChangeResponsibleUser', () => ({
  useChangeResponsibleUser: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useWorkerFilter', () => ({
  useWorkerFilter: () => ({
    isTeamMode: filterState.isTeamMode,
    employees: [],
    selectedTypes: ['onboarding', 'offboarding', 'transfer'],
    toggleType: vi.fn(),
    filteredWorkers: [],
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
  () => ({
    WorkerSelectAllCheckbox: ({
      onChange,
    }: {
      onChange: (items: unknown[]) => void;
    }) => (
      <button
        onClick={() =>
          onChange([
            { engagementNumber: 'worker-1', engagementTitle: 'Ben Beispiel' },
          ])
        }
      >
        Select Ben
      </button>
    ),
  })
);

beforeEach(() => { vi.clearAllMocks(); filterState.isTeamMode = false; });

describe('handyman deletion confirmation', () => {
  it('requires confirmation before deleting the selected handyman', async () => {
    const user = userEvent.setup();
    render(<WorkerLifeCycle />);
    await user.click(screen.getByRole('button', { name: 'Select Ben' }));
    await user.click(
      screen.getByRole('button', { name: 'Ausgewählte Handwerker löschen' })
    );
    expect(deleteWorkersMutation).not.toHaveBeenCalled();
    expect(screen.getByText(/Möchtest du „Ben Beispiel“/)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Löschen bestätigen' })
    );
    expect(deleteWorkersMutation).toHaveBeenCalledExactlyOnceWith(
      ['worker-1'],
      expect.any(Object)
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the handyman and selection when deletion is canceled', async () => {
    const user = userEvent.setup();
    render(<WorkerLifeCycle />);
    await user.click(screen.getByRole('button', { name: 'Select Ben' }));
    await user.click(
      screen.getByRole('button', { name: 'Ausgewählte Handwerker löschen' })
    );
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(deleteWorkersMutation).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('1 ausgewählt')).toBeInTheDocument();
  });
});

it('removes Aufgaben and Status headers in Team mode and restores them outside Team', () => {
  filterState.isTeamMode = true;
  const view = render(<WorkerLifeCycle />);
  expect(screen.queryByRole('columnheader', { name: 'Aufgaben' })).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  filterState.isTeamMode = false;
  view.rerender(<WorkerLifeCycle />);
  expect(screen.getByRole('columnheader', { name: 'Aufgaben' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
});
