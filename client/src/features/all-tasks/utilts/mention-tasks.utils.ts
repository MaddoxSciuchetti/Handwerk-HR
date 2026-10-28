import type { IssueResponse } from '../types/index.types';

export function openMentionTasks(tasks: IssueResponse[] | undefined) {
  return (tasks ?? []).filter(
    (task) => task.mentioned && task.status !== 'done'
  );
}
