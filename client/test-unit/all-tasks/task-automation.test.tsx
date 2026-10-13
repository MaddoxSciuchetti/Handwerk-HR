import TaskAutomation from '@/features/all-tasks/components/TaskAutomation';
import type { TaskSidebarForm } from '@/features/all-tasks/types/index.types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { renderWithAppQueryClient } from 'test-unit/test-utils';
import { describe, expect, it, vi } from 'vitest';

const { runTaskAutomation } = vi.hoisted(() => ({
  runTaskAutomation: vi.fn(),
}));

vi.mock('@/features/all-tasks/api/tasks.api', () => ({
  runTaskAutomation,
}));

function TaskAutomationHarness() {
  const {
    control,
    formState: { errors },
    setValue,
  } = useForm<TaskSidebarForm>({
    defaultValues: {
      title: 'Microsoft sperren',
      workerEngagementId: 'engagement-1',
      assigneeUserId: 'user-1',
      status: 'open',
      automation: 'o365-block-signin',
    },
  });

  return (
    <TaskAutomation
      taskId="task-1"
      control={control}
      errors={errors}
      setValue={setValue}
      disabled={false}
    />
  );
}

describe('TaskAutomation', () => {
  it('shows a purple loading indicator while an automation is running', async () => {
    let resolveAutomation: (() => void) | undefined;
    runTaskAutomation.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveAutomation = resolve;
      })
    );
    const user = userEvent.setup();
    renderWithAppQueryClient(<TaskAutomationHarness />);

    const runButton = screen.getByRole('button', { name: 'Go' });
    await user.click(runButton);

    expect(runButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass(
      'text-(--automation-accent)'
    );
    expect(screen.getByText('Wird ausgeführt…')).toBeInTheDocument();

    resolveAutomation?.();
    await waitFor(() =>
      expect(runButton).toHaveAttribute('aria-busy', 'false')
    );
  });
});
