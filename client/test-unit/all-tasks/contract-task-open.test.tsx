import { TaskItem } from '@/features/all-tasks/components/TaskItem';
import type { IssueResponse } from '@/features/all-tasks/types/index.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

vi.mock('@/features/all-tasks/components/ui/TaskStatusPicker', () => ({
  TaskStatusPicker: () => null,
}));

it.each([
  ['contract_send', 'open'],
  ['contract_send', 'done'],
  ['contract_confirm', 'open'],
  ['contract_confirm', 'done'],
] as const)(
  'opens the sidebar for a %s task that is %s with mouse and keyboard',
  async (kind, status) => {
    const task = {
      id: 'contract-task',
      workerEngagementId: 'engagement',
      title: 'Arbeitsvertrag drucken',
      kind,
      status,
      priority: 'medium',
      createdAt: '2026-10-28T10:00:00Z',
    } as IssueResponse;
    const onOpenEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <table>
        <tbody>
          <TaskItem
            task={task}
            isSelected={false}
            onOpenEdit={onOpenEdit}
            setLargeEditMode={vi.fn()}
            setEditModeData={vi.fn()}
          />
        </tbody>
      </table>
    );
    const row = screen.getByRole('row', {
      name: 'Arbeitsvertrag drucken öffnen',
    });
    await user.click(row);
    expect(onOpenEdit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        taskId: task.id,
        workerEngagementId: 'engagement',
      })
    );
    row.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onOpenEdit).toHaveBeenCalledTimes(3);
  }
);
