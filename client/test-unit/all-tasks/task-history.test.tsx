import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MutationObserver } from '@tanstack/react-query';
import queryClient from '@/config/query.client';
import { renderWithAppQueryClient } from '../test-utils';
import TaskHistory from '@/features/worker-task-management/components/tasks/task-sidebar/task-history/TaskHistory';
import { getTaskHistory } from '@/features/worker-task-management/api/index.api';
import { updateTask } from '@/features/all-tasks/api/tasks.api';
import { taskMutations } from '@/features/all-tasks/query-options/mutations/tasks.mutations';

vi.mock('@/features/worker-task-management/api/index.api', () => ({
  getTaskHistory: vi.fn(),
}));
vi.mock('@/features/all-tasks/api/tasks.api', () => ({
  updateTask: vi.fn(),
  createTask: vi.fn(),
  deleteTasks: vi.fn(),
  saveTaskComment: vi.fn(),
}));

beforeEach(() => {
  queryClient.clear();
  vi.resetAllMocks();
});

it('refreshes the visible history after saving a task edit', async () => {
  vi.mocked(getTaskHistory)
    .mockResolvedValueOnce([])
    .mockResolvedValue([
      {
        kind: 'audit',
        id: 'audit',
        action: 'issue.updated',
        createdAt: '2026-10-23T08:00:00Z',
        actorUser: {
          id: 'editor',
          firstName: 'Ada',
          lastName: 'Test',
          email: 'ada@test.de',
          avatarUrl: null,
        },
        status: null,
        changes: [{ field: 'title', from: 'Before', to: 'After' }],
      },
    ]);
  vi.mocked(updateTask).mockResolvedValue({});
  renderWithAppQueryClient(<TaskHistory taskId="task" hideComments />);
  fireEvent.click(screen.getByRole('button', { name: 'Bearbeitungsverlauf' }));
  await screen.findByText(
    'Es wurden noch keine Änderungen oder Kommentare erfasst'
  );
  const mutation = new MutationObserver(
    queryClient,
    taskMutations.updateTask()
  );
  await mutation.mutate({ taskId: 'task', data: { title: 'After' } });
  expect(await screen.findByText('After')).toBeVisible();
  expect(screen.getByText('Before')).toBeVisible();
  expect(screen.getByText('Vorher')).toBeVisible();
  expect(screen.getByText('Nachher')).toBeVisible();
  expect(screen.getByText('Ada Test')).toBeVisible();
});

it('shows a load failure instead of claiming the history is empty and allows retrying', async () => {
  vi.mocked(getTaskHistory)
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValue([]);
  renderWithAppQueryClient(<TaskHistory taskId="task" />);
  fireEvent.click(screen.getByRole('button', { name: 'Bearbeitungsverlauf' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Der Bearbeitungsverlauf konnte nicht geladen werden.'
  );
  expect(
    screen.queryByText(
      'Es wurden noch keine Änderungen oder Kommentare erfasst'
    )
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  );
  expect(
    await screen.findByText(
      'Es wurden noch keine Änderungen oder Kommentare erfasst'
    )
  ).toBeVisible();
});

it('separates actual changes and hides unchanged fields and empty update entries', async () => {
  const entry = {
    kind: 'audit' as const,
    id: 'audit',
    action: 'issue.updated',
    createdAt: '2026-10-23T08:00:00Z',
    actorUser: {
      id: 'editor',
      firstName: 'Madd',
      lastName: 'Madd',
      email: 'madd@test.de',
      avatarUrl: 'https://example.test/broken.png',
    },
    status: null,
    changes: [
      { field: 'title', from: 'Arbeitsvertrag', to: 'Arbeitsvertrag' },
      { field: 'status', from: 'Offen', to: 'Offen' },
      { field: 'sequence', from: null, to: null },
      { field: 'mailSenderAddress', from: null, to: '' },
      { field: 'assigneeUserId', from: null, to: 'Preview User' },
      { field: 'description', from: 'Old description', to: 'New description' },
    ],
  };
  vi.mocked(getTaskHistory).mockResolvedValue([
    entry,
    {
      ...entry,
      id: 'noop',
      changes: [{ field: 'title', from: 'Same', to: 'Same' }],
    },
  ]);
  renderWithAppQueryClient(<TaskHistory taskId="task" hideComments />);
  fireEvent.click(screen.getByRole('button', { name: 'Bearbeitungsverlauf' }));
  expect(await screen.findByText('Preview User')).toBeVisible();
  expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
    'Zuständig',
    'Beschreibung',
  ]);
  expect(screen.getAllByRole('definition')).toHaveLength(2);
  expect(screen.getByText('Zuständig geändert')).toBeVisible();
  expect(screen.getByText('Beschreibung geändert')).toBeVisible();
  expect(screen.queryByText('Aufgabe aktualisiert')).not.toBeInTheDocument();
  expect(screen.queryByText('Arbeitsvertrag')).not.toBeInTheDocument();
  expect(screen.queryByText('sequence')).not.toBeInTheDocument();
  expect(screen.getAllByText('MM')).toHaveLength(2);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
