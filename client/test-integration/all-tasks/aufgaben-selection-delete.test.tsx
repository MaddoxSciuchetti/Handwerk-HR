import Tasks from '@/features/all-tasks/components/Tasks';
import type { IssueResponse } from '@/features/all-tasks/types/index.types';
import queryClient from '@/config/query.client';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAppQueryClient } from 'test-unit/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { taskStore } = vi.hoisted(() => ({
  taskStore: {
    remaining: [] as IssueResponse[],
  },
}));

vi.mock('@/features/all-tasks/api/tasks.api', () => ({
  getTasks: async () => [...taskStore.remaining],
  deleteTasks: vi.fn(async (ids: string[]) => {
    taskStore.remaining = taskStore.remaining.filter(
      (t) => !ids.includes(t.id)
    );
  }),
}));

vi.mock('@/features/all-tasks/components/TaskSidebar', () => ({
  TaskSidebar: () => null,
}));

vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'user-1', firstName: 'Alex' },
  }),
}));

function makeTask(id: string, title: string): IssueResponse {
  return {
    id,
    workerEngagementId: 'we-1',
    createdByUserId: 'user-1',
    assigneeUserId: 'user-1',
    templateItemId: null,
    status: 'open',
    kind: 'standard',
    isTemporary: false,
    title,
    description: null,
    priority: 'medium',
    dueDate: null,
    startedAt: '2025-01-01T00:00:00.000Z',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };
}

function getTaskRowByTitle(title: string) {
  const titleNode = screen.getByText(title);
  const row = titleNode.closest('.group');
  expect(row).toBeTruthy();
  return row as HTMLElement;
}

describe('Aufgaben (all tasks) — row selection & bulk delete', () => {
  beforeEach(() => {
    queryClient.clear();
    taskStore.remaining = [
      makeTask('11111111-1111-4111-8111-111111111111', 'Alpha Aufgabe'),
      makeTask('22222222-2222-4222-8222-222222222222', 'Beta Aufgabe'),
    ];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the handyman automation bar off the list when a saved run is cached', async () => {
    const task = taskStore.remaining[0];
    task.title = 'Arbeitsvertrag unterschrieben';
    task.status = 'done';
    task.workerEngagement = {
      workerId: 'worker-1',
      worker: { firstName: 'Ada', lastName: 'Lovelace' },
      templateApplication: {
        id: 'application-1',
        completedAt: '2026-10-24T08:00:00.000Z',
        resultsDismissedAt: null,
      },
    };
    queryClient.setQueryData(
      ['template-application-result', 'worker-1', task.workerEngagementId],
      {
        target: {
          workerId: 'worker-1',
          engagementId: task.workerEngagementId,
          label: 'Ada Lovelace',
        },
        templateName: 'Onboarding',
        result: { count: 1, issueIds: [task.id], outcomes: [], running: false },
      }
    );

    renderWithAppQueryClient(<Tasks />);

    await screen.findByText('Arbeitsvertrag unterschrieben');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Ausgeführte Aufgaben anzeigen' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Template wählen' })
    ).not.toBeInTheDocument();
  });

  it('keeps the row checkbox visible and selects every task from the column header', async () => {
    const user = userEvent.setup();
    renderWithAppQueryClient(<Tasks />);

    await screen.findByText('Alpha Aufgabe');

    const row = getTaskRowByTitle('Alpha Aufgabe');
    const selectControl = within(row).getByRole('checkbox', {
      name: /Auswählen/i,
    });
    const selectSlot = selectControl.parentElement;

    expect(selectSlot).not.toHaveClass('opacity-0');
    expect(selectSlot?.className).toMatch(/inset-y-0/);
    expect(selectSlot?.className).toMatch(/\bw-10\b/);

    await user.click(
      screen.getByRole('checkbox', { name: 'Alle Aufgaben auswählen' })
    );
    expect(await screen.findByText(/2 ausgewählt/i)).toBeInTheDocument();
    expect(
      within(getTaskRowByTitle('Alpha Aufgabe')).getByRole('checkbox', {
        name: /Auswahl entfernen/i,
      })
    ).toBeChecked();
    expect(
      within(getTaskRowByTitle('Beta Aufgabe')).getByRole('checkbox', {
        name: /Auswahl entfernen/i,
      })
    ).toBeChecked();

    await user.click(
      screen.getByRole('checkbox', { name: 'Alle Aufgaben abwählen' })
    );
    expect(screen.queryByText(/ausgewählt/i)).not.toBeInTheDocument();
  });

  it('does not outline integration sequences with the automation line', async () => {
    taskStore.remaining[0].integrationProvider = 'microsoft_graph';
    taskStore.remaining[0].sequence = 'microsoft_deactivate_account';
    renderWithAppQueryClient(<Tasks />);
    await screen.findByText('Alpha Aufgabe');
    expect(getTaskRowByTitle('Alpha Aufgabe')).not.toHaveAttribute(
      'data-automation-task'
    );
  });

  it('marks only configured automation tasks for the animated purple outline', async () => {
    taskStore.remaining[0].automation = 'o365-block-signin';
    renderWithAppQueryClient(<Tasks />);

    await screen.findByText('Alpha Aufgabe');

    expect(getTaskRowByTitle('Alpha Aufgabe')).toHaveAttribute(
      'data-automation-task',
      'true'
    );
    expect(getTaskRowByTitle('Beta Aufgabe')).not.toHaveAttribute(
      'data-automation-task'
    );
  });

  it('places confirmation tasks before the normal task list', async () => {
    taskStore.remaining[1].kind = 'contract_confirm';
    renderWithAppQueryClient(<Tasks />);

    await screen.findByText('Alpha Aufgabe');

    const rows = Array.from(
      screen
        .getByText('Alpha Aufgabe')
        .closest('tbody')
        ?.querySelectorAll('tr') ?? []
    );
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Beta Aufgabe'),
      expect.stringContaining('Alpha Aufgabe'),
    ]);
  });

  it('shows the selection control at full opacity when the task is selected (bulk mode)', async () => {
    const user = userEvent.setup();
    renderWithAppQueryClient(<Tasks />);

    await screen.findByText('Alpha Aufgabe');

    const row = getTaskRowByTitle('Alpha Aufgabe');
    const selectControl = within(row).getByRole('checkbox', {
      name: /Auswählen/i,
    });

    await user.click(selectControl);

    const selected = within(getTaskRowByTitle('Alpha Aufgabe')).getByRole(
      'checkbox',
      { name: /Auswahl entfernen/i }
    );
    expect(selected).toBeChecked();
    expect(selected.parentElement).not.toHaveClass('opacity-0');
  });

  it('opens the bottom bar after selecting a row, deletes via the bar, and removes the task from the list', async () => {
    const user = userEvent.setup();
    renderWithAppQueryClient(<Tasks />);

    await screen.findByText('Alpha Aufgabe');
    await screen.findByText('Beta Aufgabe');

    const alphaRow = getTaskRowByTitle('Alpha Aufgabe');
    const selectAlpha = within(alphaRow).getByRole('checkbox', {
      name: /Auswählen/i,
    });

    await user.hover(alphaRow);
    await user.click(selectAlpha);

    expect(await screen.findByText(/1 ausgewählt/i)).toBeInTheDocument();

    const deleteBulk = screen.getByRole('button', {
      name: /Ausgewählte Aufgaben löschen/i,
    });
    expect(deleteBulk).toBeEnabled();
    await user.click(deleteBulk);

    await waitFor(() => {
      expect(screen.queryByText('Alpha Aufgabe')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Beta Aufgabe')).toBeInTheDocument();

    expect(screen.queryByText(/1 ausgewählt/i)).not.toBeInTheDocument();
  });
});
