import queryClient from '@/config/query.client';
import { saveTaskComment } from '@/features/all-tasks/api/tasks.api';
import { taskMutations } from '@/features/all-tasks/query-options/mutations/tasks.mutations';
import { TASKHISTORY } from '@/features/worker-task-management/consts/query-key.consts';
import type {
  TaskHistoryCommentEntry,
  TaskHistoryItem,
} from '@/features/worker-task-management/types/index.types';
import { MutationObserver } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/all-tasks/api/tasks.api', () => ({
  saveTaskComment: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTasks: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const actor = {
  id: 'user-1',
  email: 'a@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUrl: null,
};
const key = [TASKHISTORY, 'task-1'];
const saved: TaskHistoryCommentEntry = {
  kind: 'comment',
  id: 'comment-1',
  body: 'Hello',
  user: actor,
  createdAt: '2026-10-17T09:00:00.000Z',
  updatedAt: '2026-10-17T09:00:00.000Z',
};
const history = () => queryClient.getQueryData<TaskHistoryItem[]>(key);

beforeEach(() => {
  queryClient.clear();
  vi.resetAllMocks();
});

describe('immediate chat updates', () => {
  it('shows a message before the response and replaces it without duplicates', async () => {
    let finish!: (value: {
      comment: TaskHistoryCommentEntry;
      mailFailed: boolean;
    }) => void;
    vi.mocked(saveTaskComment).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const observer = new MutationObserver(
      queryClient,
      taskMutations.saveTaskComment(actor)
    );
    const request = observer.mutate({ taskId: 'task-1', body: 'Hello' });
    await vi.waitFor(() =>
      expect(history()?.[0]).toMatchObject({ body: 'Hello', user: actor })
    );
    expect(observer.getCurrentResult().isPending).toBe(true);
    finish({ comment: saved, mailFailed: false });
    await request;
    expect(history()).toEqual([saved]);
  });

  it('removes a failed optimistic message and preserves existing history', async () => {
    queryClient.setQueryData(key, [saved]);
    vi.mocked(saveTaskComment).mockRejectedValue(new Error('offline'));
    const observer = new MutationObserver(
      queryClient,
      taskMutations.saveTaskComment(actor)
    );
    await expect(
      observer.mutate({ taskId: 'task-1', body: 'Second message' })
    ).rejects.toThrow('offline');
    expect(history()).toEqual([saved]);
  });

  it('restores an edited message when saving fails', async () => {
    queryClient.setQueryData(key, [saved]);
    let fail!: (reason: Error) => void;
    vi.mocked(saveTaskComment).mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        })
    );
    const observer = new MutationObserver(
      queryClient,
      taskMutations.saveTaskComment(actor)
    );
    const request = observer.mutate({
      taskId: 'task-1',
      commentId: saved.id,
      body: 'Edited',
    });
    const rejected = expect(request).rejects.toThrow('offline');
    await vi.waitFor(() =>
      expect(history()?.[0]).toMatchObject({ body: 'Edited' })
    );
    fail(new Error('offline'));
    await rejected;
    expect(history()).toEqual([saved]);
  });
});
