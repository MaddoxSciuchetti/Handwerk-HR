import Tasks from '@/features/all-tasks/components/Tasks';
import type { IssueResponse } from '@/features/all-tasks/types/index.types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
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
    statusId: 'st-1',
    title,
    description: null,
    priority: 'medium',
    dueDate: null,
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
    taskStore.remaining = [
      makeTask('11111111-1111-4111-8111-111111111111', 'Alpha Aufgabe'),
      makeTask('22222222-2222-4222-8222-222222222222', 'Beta Aufgabe'),
    ];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses opacity + group-hover classes so the checkbox is hidden until row hover (CSS in real browsers)', async () => {
    renderWithProviders(<Tasks />);

    await screen.findByText('Alpha Aufgabe');

    const row = getTaskRowByTitle('Alpha Aufgabe');
    const selectBtn = within(row).getByRole('button', {
      name: /Auswählen/i,
    });

    expect(selectBtn.classList.contains('opacity-0')).toBe(true);
    expect(selectBtn.className).toMatch(/group-hover:opacity-100/);
  });

  it('shows the selection control at full opacity when the task is selected (bulk mode)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Tasks />);

    await screen.findByText('Alpha Aufgabe');

    const row = getTaskRowByTitle('Alpha Aufgabe');
    const selectBtn = within(row).getByRole('button', {
      name: /Auswählen/i,
    });

    await user.click(selectBtn);

    expect(selectBtn).toHaveAttribute('aria-pressed', 'true');
    expect(selectBtn.classList.contains('opacity-100')).toBe(true);
  });

  it('opens the bottom bar after selecting a row, deletes via the bar, and removes the task from the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Tasks />);

    await screen.findByText('Alpha Aufgabe');
    await screen.findByText('Beta Aufgabe');

    const alphaRow = getTaskRowByTitle('Alpha Aufgabe');
    const selectAlpha = within(alphaRow).getByRole('button', {
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
