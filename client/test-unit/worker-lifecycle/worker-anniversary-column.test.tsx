import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import WorkerLifeCycle from '@/features/worker-lifecycle/components/WorkerLifecycle';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';

const state = vi.hoisted(() => ({
  workers: [] as WorkerRecord[],
  loading: false,
  team: false,
}));
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { id: 'user', firstName: 'Test' } }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useHome', () => ({
  default: () => ({
    workers: state.workers,
    isLoading: state.loading,
    toggleModal: vi.fn(),
  }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useWorkerMutaitons', () => ({
  default: () => ({ deleteWorkersMutation: vi.fn() }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useSwitchEngagementType', () => ({
  useSwitchEngagementType: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useChangeResponsibleUser', () => ({
  useChangeResponsibleUser: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/features/worker-lifecycle/hooks/useWorkerFilter', () => ({
  useWorkerFilter: () => ({
    isTeamMode: state.team,
    employees: [],
    selectedTypes: ['transfer'],
    toggleType: vi.fn(),
    filteredWorkers: state.workers,
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
vi.mock('@/features/worker-lifecycle/components/EngagementTypeSwitch', () => ({
  default: () => 'Typ',
}));
vi.mock('@/features/worker-lifecycle/components/ResponsibleUserPicker', () => ({
  ResponsibleUserPicker: () => 'Anna',
}));
vi.mock(
  '@/features/worker-lifecycle/components/ui/EngagementProgressPicker',
  () => ({ EngagementProgressPicker: () => 'Pending' })
);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-30T12:00:00Z'));
  state.team = false;
  state.loading = false;
  state.workers = [
    ['worker-a', 'Alex', '2022-11-12', 'onboarding'],
    ['worker-b', 'Ben', '2017-03-04', 'offboarding'],
    ['worker-c', 'Chris', null, 'transfer'],
    ['worker-d', 'Dana', 'invalid', 'transfer'],
  ].map(([id, firstName, entryDate, type]) => ({
    id,
    firstName,
    lastName: 'Example',
    entryDate,
    engagements: [
      {
        id: `${id}-phase`,
        type,
        status: 'pending',
        responsibleUser: { id: 'user' },
      },
    ],
  })) as WorkerRecord[];
});
afterEach(() => vi.useRealTimers());

async function addColumn() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Add column' }));
  expect(screen.getAllByRole('menuitem')).toHaveLength(1);
  await user.click(screen.getByRole('menuitem', { name: 'Anniversary date' }));
}
const workerRow = (name: string) => screen.getByText(name).closest('tr')!;

it('adds one date column tied to each worker through reorder, filtering and refresh', async () => {
  const view = render(<WorkerLifeCycle />);
  expect(
    screen.queryByRole('columnheader', { name: 'Anniversary' })
  ).not.toBeInTheDocument();
  await addColumn();
  expect(
    screen.getAllByRole('columnheader', { name: 'Anniversary' })
  ).toHaveLength(1);
  expect(
    screen.queryByRole('button', { name: 'Add column' })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(within(workerRow('Alex')).getByText('12.11.2027')).toBeInTheDocument();
  expect(within(workerRow('Ben')).getByText('04.03.2027')).toBeInTheDocument();
  for (const name of ['Chris', 'Dana'])
    expect(
      within(workerRow(name)).getAllByRole('cell').at(-1)
    ).toHaveTextContent('—');
  state.workers = [state.workers[1], state.workers[0]];
  view.rerender(<WorkerLifeCycle />);
  expect(within(workerRow('Ben')).getByText('04.03.2027')).toBeInTheDocument();
  expect(within(workerRow('Alex')).getByText('12.11.2027')).toBeInTheDocument();
  state.team = true;
  state.workers = [{ ...state.workers[0], entryDate: '2024-02-03' }];
  view.rerender(<WorkerLifeCycle />);
  expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  expect(within(workerRow('Ben')).getByText('03.02.2029')).toBeInTheDocument();
  expect(screen.queryByText('Alex')).not.toBeInTheDocument();
  view.unmount();
  render(<WorkerLifeCycle />);
  expect(
    screen.queryByRole('columnheader', { name: 'Anniversary' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Add column' })
  ).toBeInTheDocument();
});

it.each([false, true])(
  'aligns headers, colgroup and skeleton cells with team mode %s',
  async (team) => {
    state.team = team;
    state.loading = true;
    const { container } = render(<WorkerLifeCycle />);
    await addColumn();
    const columns = team ? 4 : 6;
    expect(screen.getAllByRole('columnheader')).toHaveLength(columns);
    expect(container.querySelectorAll('colgroup col')).toHaveLength(columns);
    for (const row of container.querySelectorAll('tbody tr'))
      expect(row.querySelectorAll('td')).toHaveLength(columns);
  }
);
