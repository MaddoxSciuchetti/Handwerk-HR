import { TaskItem } from '@/features/all-tasks/components/TaskItem';
import type { IssueResponse } from '@/features/all-tasks/types/index.types';
import { openMentionTasks } from '@/features/all-tasks/utilts/mention-tasks.utils';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/all-tasks/components/ui/TaskStatusPicker', () => ({
  TaskStatusPicker: () => null,
}));

const task: IssueResponse = {
  id: 'source-task',
  workerEngagementId: 'engagement-1',
  createdByUserId: 'author',
  assigneeUserId: 'someone-else',
  templateItemId: null,
  status: 'open',
  kind: 'standard',
  isTemporary: false,
  title: 'Vertrag prüfen',
  description: null,
  priority: 'medium',
  dueDate: null,
  startedAt: '2026-10-20T10:00:00.000Z',
  completedAt: null,
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
};

describe('task mentions', () => {
  it('shows the 1 on the original task, even when assigned to someone else', () => {
    render(
      <table>
        <tbody>
          <TaskItem
            task={{ ...task, mentioned: true }}
            isSelected={false}
            onOpenEdit={vi.fn()}
            setLargeEditMode={vi.fn()}
            setEditModeData={vi.fn()}
          />
        </tbody>
      </table>
    );
    expect(screen.getByLabelText('1 Erwähnung')).toHaveTextContent('1');
    expect(screen.getByText('Vertrag prüfen')).toBeInTheDocument();
  });

  it('counts the source task once and excludes tasks without a mention or already completed', () => {
    expect(
      openMentionTasks([
        { ...task, mentioned: true },
        { ...task, id: 'no-mention', mentioned: false },
        {
          ...task,
          id: 'legacy-mention',
          assigneeOnly: true,
          assigneeUserId: 'recipient',
        },
        { ...task, id: 'done', mentioned: true, status: 'done' },
      ]).map((item) => item.id)
    ).toEqual(['source-task']);
  });
});
