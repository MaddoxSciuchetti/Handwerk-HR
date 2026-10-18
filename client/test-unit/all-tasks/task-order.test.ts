import { confirmationTasksFirst } from '@/features/all-tasks/utilts/task-order.utils';
import type { IssueResponse } from '@/features/all-tasks/types/index.types';
import { describe, expect, it } from 'vitest';

function makeTask(
  id: string,
  kind: IssueResponse['kind'] = 'standard'
): IssueResponse {
  return {
    id,
    workerEngagementId: 'engagement-1',
    createdByUserId: 'user-1',
    assigneeUserId: 'user-1',
    templateItemId: null,
    status: 'open',
    kind,
    isTemporary: false,
    title: id,
    description: null,
    priority: 'medium',
    dueDate: null,
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('confirmationTasksFirst', () => {
  it('groups confirmation tasks first and preserves order inside both groups', () => {
    const tasks = [
      makeTask('standard-1'),
      makeTask('confirmation-1', 'contract_confirm'),
      makeTask('standard-2'),
      makeTask('confirmation-2', 'contract_confirm'),
    ];

    expect(confirmationTasksFirst(tasks).map((task) => task.id)).toEqual([
      'confirmation-1',
      'confirmation-2',
      'standard-1',
      'standard-2',
    ]);
    expect(tasks.map((task) => task.id)).toEqual([
      'standard-1',
      'confirmation-1',
      'standard-2',
      'confirmation-2',
    ]);
  });
});
