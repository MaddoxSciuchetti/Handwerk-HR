import queryClient from '@/config/query.client';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';
import TaskManagement from '@/features/worker-task-management/components/tasks/WorkerTaskManagement';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithAppQueryClient, renderWithProviders } from 'test-unit/test-utils';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/features/worker-task-management/hooks/useTaskData', () => ({
  default: () => ({ data: undefined, isLoading: true }),
}));
vi.mock('@/features/worker-task-management/hooks/useGetWorkerFiles', () => ({
  default: () => ({ fetchFiles: [] }),
}));
vi.mock('@/features/all-tasks/hooks/useTaskSidebar', () => ({
  useTaskSidebar: () => ({
    sidebarKey: 'sidebar',
    sidebarProps: { isOpen: false, taskState: 'create', taskEditState: {} },
    openForEdit: vi.fn(),
    openForCreate: vi.fn(),
    patchTaskEditState: vi.fn(),
  }),
}));
vi.mock('@/features/all-tasks/components/TaskSidebar', () => ({
  TaskSidebar: () => null,
}));
vi.mock('@/features/worker-lifecycle/components/WorkerInformation', () => ({
  default: () => <div>Worker information</div>,
}));

afterEach(() => {
  queryClient.removeQueries({ queryKey: [ALL_WORKER_DATA] });
});

it('keeps the engagement navigation and header mounted while switching loading tabs', () => {
  renderWithProviders(<TaskManagement workerId="worker-1" />);
  const header = screen.getByText('Aufgaben', {
    selector: '[data-slot="card-title"]',
  });
  const cardHeader = header.parentElement;
  expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  fireEvent.click(screen.getByRole('button', { name: /^Dateien$/ }));
  expect(
    screen.getByRole('status', { name: 'Dateiordner werden geladen' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('Dateien', { selector: '[data-slot="card-title"]' })
      .parentElement
  ).toBe(cardHeader);
});

it('opens Team workers on Information while detail data is still loading', () => {
  queryClient.setQueryData<WorkerRecord[]>([ALL_WORKER_DATA], [
    {
      id: 'team-worker',
      firstName: 'Team',
      lastName: 'Member',
      email: 'team@example.com',
      position: null,
      status: 'active',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      engagements: [
        {
          id: 'engagement-1',
          type: 'transfer',
          status: 'completed',
        } as WorkerRecord['engagements'][number],
      ],
    },
  ]);

  renderWithAppQueryClient(<TaskManagement workerId="team-worker" />);

  expect(
    screen.getByText('Information', { selector: '[data-slot="card-title"]' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Aufgaben', exact: true })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText('Aufgaben', { selector: '[data-slot="card-title"]' })
  ).not.toBeInTheDocument();
});
