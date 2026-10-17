import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import queryClient from '@/config/query.client';
import { saveTaskComment } from '@/features/all-tasks/api/tasks.api';
import { TaskChat } from '@/features/all-tasks/components/TaskChat';

vi.mock('@/features/all-tasks/api/tasks.api', () => ({
  saveTaskComment: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTasks: vi.fn(),
}));
const actor = {
  id: 'user-1',
  email: 'a@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUrl: null,
};
const comment = {
  kind: 'comment',
  id: 'comment-1',
  body: 'Earlier message',
  user: actor,
  createdAt: '2026-10-17T09:00:00.000Z',
  updatedAt: '2026-10-17T09:00:00.000Z',
};
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({
    user: {
      id: 'user-1',
      email: 'a@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    },
  }),
}));
vi.mock('@/features/worker-task-management/hooks/useGetTaskHistory', () => ({
  useGetTaskHistory: () => ({
    historyData: [
      {
        kind: 'comment',
        id: 'comment-1',
        body: 'Earlier message',
        user: {
          id: 'user-1',
          email: 'a@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
      },
    ],
    isLoading: false,
  }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

beforeEach(() => {
  queryClient.clear();
  vi.resetAllMocks();
});
function showChat() {
  render(
    <QueryClientProvider client={queryClient}>
      <TaskChat taskId="task-1" coworkers={[]} currentUserId="user-1" />
    </QueryClientProvider>
  );
}

describe('task chat sending', () => {
  it('sends a new message and clears the composer', async () => {
    vi.mocked(saveTaskComment).mockResolvedValue({
      comment: { ...comment, id: 'comment-2', body: 'New message' },
      mailFailed: false,
    });
    showChat();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'New message' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    await waitFor(() =>
      expect(saveTaskComment).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'New message', commentId: null })
      )
    );
    await waitFor(() => expect(screen.getByRole('textbox')).toBeEnabled());
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('saves an edited message and leaves edit mode', async () => {
    vi.mocked(saveTaskComment).mockResolvedValue({
      comment: { ...comment, body: 'Updated' },
      mailFailed: false,
    });
    showChat();
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    await waitFor(() =>
      expect(saveTaskComment).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Updated', commentId: 'comment-1' })
      )
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Bearbeiten abbrechen' })
      ).not.toBeInTheDocument()
    );
  });

  it('keeps the draft available to retry after a failed request', async () => {
    vi.mocked(saveTaskComment).mockRejectedValue(new Error('offline'));
    showChat();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Retry me' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    await waitFor(() =>
      expect(screen.getByRole('textbox')).toHaveValue('Retry me')
    );
    expect(screen.getByRole('button', { name: 'Senden' })).toBeEnabled();
  });
});
