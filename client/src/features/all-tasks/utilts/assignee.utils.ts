import type { IssueResponse } from '../types/index.types';

export function getAssigneeLabel(task: IssueResponse): string {
  if (task.assignee) {
    const name = `${task.assignee.firstName} ${task.assignee.lastName}`.trim();
    if (name) return name;
  }

  return '—';
}
