import { TaskItem } from '@/features/all-tasks/components/TaskItem';
import type { IssueResponse } from '@/features/all-tasks/types/index.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

vi.mock('@/features/all-tasks/components/ui/TaskStatusPicker', () => ({
  TaskStatusPicker: () => null,
}));

it.each(['open', 'done'] as const)(
  'opens the contract from a %s task with mouse and keyboard',
  async (status) => {
    const task = {
      id: 'contract-task',
      workerEngagementId: 'engagement',
      title: 'Arbeitsvertrag drucken',
      kind: 'contract_send',
      status,
      priority: 'medium',
      createdAt: '2026-10-28T10:00:00Z',
    } as IssueResponse;
    const onOpenContractSend = vi.fn();
    const onOpenEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <table>
        <tbody>
          <TaskItem
            task={task}
            isSelected={false}
            onOpenEdit={onOpenEdit}
            onOpenContractSend={onOpenContractSend}
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
    expect(onOpenContractSend).toHaveBeenLastCalledWith(task);
    row.focus();
    await user.keyboard('{Enter}');
    expect(onOpenContractSend).toHaveBeenCalledTimes(2);
    expect(onOpenEdit).not.toHaveBeenCalled();
  }
);
