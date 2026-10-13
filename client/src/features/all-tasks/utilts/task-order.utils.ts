import type { IssueResponse } from '../types/index.types';

export function confirmationTasksFirst(
  tasks: readonly IssueResponse[]
): IssueResponse[] {
  const confirmationTasks: IssueResponse[] = [];
  const remainingTasks: IssueResponse[] = [];

  for (const task of tasks) {
    if (task.kind === 'contract_confirm') {
      confirmationTasks.push(task);
    } else {
      remainingTasks.push(task);
    }
  }

  return [...confirmationTasks, ...remainingTasks];
}
