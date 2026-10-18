import type { IssueResponse } from '../types/index.types';

export function openMentionTasks(
  tasks: IssueResponse[] | undefined,
  userId: string | undefined
) {
  if (!userId) return [];
  return (tasks ?? []).filter(
    (task) =>
      task.assigneeOnly &&
      task.assigneeUserId === userId &&
      task.status !== 'done'
  );
}
