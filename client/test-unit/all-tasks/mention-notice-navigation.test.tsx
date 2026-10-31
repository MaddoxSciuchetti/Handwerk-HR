import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { MentionNotice } from '@/features/all-tasks/components/MentionNotice';

const state = vi.hoisted(() => ({ navigate: vi.fn(), tasks: [] as unknown[] }));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => state.navigate,
}));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({ data: state.tasks }),
}));

const task = {
  id: 'task-1',
  title: 'Vertrag prüfen',
  status: 'open',
  mentioned: true,
  workerEngagement: {
    workerId: 'worker-1',
    worker: { firstName: 'Ada', lastName: 'Test' },
  },
};
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  state.tasks = [task];
});
it('opens the mentioned task directly under its Handwerker', async () => {
  render(<MentionNotice />);
  await userEvent.click(screen.getByRole('button', { name: 'Zur Aufgabe' }));
  expect(state.navigate).toHaveBeenCalledWith({
    to: '/user/$Id',
    params: { Id: 'worker-1' },
    search: {
      workerName: 'Ada Test',
      prevPage: 'Handwerker',
      taskId: 'task-1',
    },
  });
});
it('lets the recipient choose the task and Handwerker when several mentions arrive', async () => {
  state.tasks = [
    task,
    {
      ...task,
      id: 'task-2',
      title: 'Schlüssel abgeben',
      workerEngagement: { workerId: 'worker-2' },
    },
  ];
  render(<MentionNotice />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Aufgabe öffnen: Schlüssel abgeben' })
  );
  expect(state.navigate).toHaveBeenCalledWith(
    expect.objectContaining({
      params: { Id: 'worker-2' },
      search: expect.objectContaining({ taskId: 'task-2' }),
    })
  );
  expect(JSON.parse(localStorage.getItem('seen-mention-task-ids') ?? '[]')).toEqual([
    'task-2',
  ]);
  expect(
    screen.getByRole('button', { name: 'Aufgabe öffnen: Vertrag prüfen' })
  ).toBeInTheDocument();
});
