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
function showChat(
  coworkers = [] as { id: string; firstName: string; lastName: string }[]
) {
  render(
    <QueryClientProvider client={queryClient}>
      <TaskChat taskId="task-1" coworkers={coworkers} currentUserId="user-1" />
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

  it('selects an @ mention by keyboard and sends the mentioned coworker', async () => {
    vi.mocked(saveTaskComment).mockResolvedValue({
      comment: { ...comment, id: 'comment-2' },
      mailFailed: false,
    });
    showChat([
      { id: 'user-1', firstName: 'Ada', lastName: 'Lovelace' },
      { id: 'user-2', firstName: 'Grace', lastName: 'Hopper' },
    ]);
    const composer = screen.getByRole('textbox');
    fireEvent.change(composer, { target: { value: 'Hello @Gr' } });
    expect(screen.getByRole('option', { name: 'Grace Hopper' })).toBeVisible();
    fireEvent.keyDown(composer, { key: 'Enter' });
    expect(composer).toHaveValue('Hello @Grace Hopper ');
    expect(saveTaskComment).not.toHaveBeenCalled();
    fireEvent.keyDown(composer, { key: 'Enter' });
    await waitFor(() =>
      expect(saveTaskComment).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Hello @Grace Hopper',
          mentionUserIds: ['user-2'],
        })
      )
    );
  });

  it('edits inside the message bubble and saves only with the save icon', async () => {
    vi.mocked(saveTaskComment).mockResolvedValue({
      comment: { ...comment, body: 'Updated' },
      mailFailed: false,
    });
    showChat();
    fireEvent.click(
      screen.getByRole('button', { name: 'Letzte Nachricht bearbeiten' })
    );
    const editor = screen.getByRole('textbox', {
      name: 'Nachricht bearbeiten',
    });
    expect(editor).toHaveValue('Earlier message');
    expect(editor).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Chat' })).toHaveValue('');
    fireEvent.change(editor, {
      target: { value: 'Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Änderung speichern' }));
    await waitFor(() =>
      expect(saveTaskComment).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Updated',
          commentId: 'comment-1',
        })
      )
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Senden' })).toBeInTheDocument()
    );
  });

  it('discards an inline edit when clicking elsewhere without saving', () => {
    showChat();
    fireEvent.click(
      screen.getByRole('button', { name: 'Letzte Nachricht bearbeiten' })
    );
    const editor = screen.getByRole('textbox', {
      name: 'Nachricht bearbeiten',
    });
    fireEvent.change(editor, { target: { value: 'Unsaved change' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(saveTaskComment).not.toHaveBeenCalled();
    fireEvent.blur(editor, {
      relatedTarget: screen.getByRole('textbox', { name: 'Chat' }),
    });
    expect(
      screen.queryByRole('textbox', { name: 'Nachricht bearbeiten' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Earlier message')).toBeInTheDocument();
    expect(saveTaskComment).not.toHaveBeenCalled();
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
