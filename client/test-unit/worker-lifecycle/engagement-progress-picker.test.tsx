import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { EngagementProgressPicker } from '@/features/worker-lifecycle/components/ui/EngagementProgressPicker';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';

vi.mock(
  '@/features/worker-lifecycle/hooks/useQuickUpdateEngagementProgress',
  () => ({
    useQuickUpdateEngagementProgress: () => ({ mutate: vi.fn() }),
  })
);

it('shows completed task progress with no expected status option', async () => {
  const worker = {
    id: 'worker',
    engagements: [
      {
        id: 'engagement',
        type: 'onboarding',
        status: 'completed',
        issueCounts: [{ status: 'done', count: 7 }],
      },
    ],
  } as unknown as WorkerRecord;
  render(
    <EngagementProgressPicker
      worker={worker}
      workerId="worker"
      engagementId="engagement"
      status="completed"
    />
  );
  await userEvent.click(
    screen.getByRole('button', {
      name: 'Status: Abgeschlossen. 100% der Aufgaben erledigt. Zum Ändern klicken.',
    })
  );
  expect(screen.queryByText('Erwartet')).not.toBeInTheDocument();
  expect(
    screen.getByRole('menuitem', { name: 'Abgeschlossen' })
  ).toHaveAttribute('aria-current', 'true');
  expect(screen.getAllByRole('menuitem')).toHaveLength(4);
});

it.each([
  { status: 'pending', completed: true, label: 'Abgeschlossen' },
  { status: 'completed', completed: false, label: 'In Bearbeitung' },
  { status: 'cancelled', completed: true, label: 'Abgebrochen' },
] as const)(
  'uses server phase completion for $status / $completed',
  async ({ status, completed, label }) => {
    const worker = {
      id: 'worker',
      engagements: [
        {
          id: 'current',
          type: 'onboarding',
          status,
          taskPhaseCompleted: completed,
          issueCounts: [],
        },
        {
          id: 'original',
          type: 'onboarding',
          status: 'completed',
          issueCounts: [{ status: 'done', count: 7 }],
        },
      ],
    } as unknown as WorkerRecord;
    render(
      <EngagementProgressPicker
        worker={worker}
        workerId="worker"
        engagementId="current"
        status={status}
      />
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: `Status: ${label}. 100% der Aufgaben erledigt. Zum Ändern klicken.`,
      })
    );
    expect(screen.getByRole('menuitem', { name: label })).toHaveAttribute(
      'aria-current',
      'true'
    );
  }
);
