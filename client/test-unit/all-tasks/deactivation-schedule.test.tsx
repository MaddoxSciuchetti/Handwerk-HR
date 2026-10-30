import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { DeactivationScheduleField } from '@/features/all-tasks/components/DeactivationScheduleField';
import { TaskDeactivationSchedule } from '@/features/all-tasks/components/TaskDeactivationSchedule';
import { renderWithProviders } from '../test-utils';

const api = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));
vi.mock('@/config/apiClient', () => ({ apiJson: api }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { scheduledDeactivateAt: '2099-12-31' } });
  api.patch.mockResolvedValue({ data: { scheduledDeactivateAt: null } });
});
it('shows the shadcn calendar only after enabling scheduling', async () => {
  function Harness() {
    const [value, setValue] = useState<string | null>(null);
    return <DeactivationScheduleField value={value} onChange={setValue} />;
  }
  render(<Harness />);
  const user = userEvent.setup();
  expect(screen.queryByText('Letzter aktiver Tag')).not.toBeInTheDocument();
  await user.click(screen.getByRole('switch', { name: 'Planen' }));
  await user.click(screen.getByRole('button', { name: /Letzter aktiver Tag/ }));
  expect(screen.getByRole('grid')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('switch', { name: 'Planen' }));
  expect(screen.queryByText('Letzter aktiver Tag')).not.toBeInTheDocument();
});
it('loads the saved schedule on opening and cancels without executing', async () => {
  renderWithProviders(
    <TaskDeactivationSchedule taskId="task" disabled={false} />
  );
  const user = userEvent.setup();
  expect(await screen.findByText('Geplant · 31.12.2099')).toBeInTheDocument();
  await user.click(screen.getByRole('switch', { name: 'Planen' }));
  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith(
      '/automation/issues/task/deactivation-schedule',
      { scheduledDeactivateAt: null }
    )
  );
  await waitFor(() =>
    expect(screen.queryByText('Geplant · 31.12.2099')).not.toBeInTheDocument()
  );
});
it('changes an existing schedule using the calendar', async () => {
  api.patch.mockResolvedValue({
    data: { scheduledDeactivateAt: '2099-12-30' },
  });
  renderWithProviders(
    <TaskDeactivationSchedule taskId="task" disabled={false} />
  );
  await screen.findByText('Geplant · 31.12.2099');
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Letzter aktiver Tag/ }));
  const day = screen
    .getAllByRole('button')
    .find((button) => button.getAttribute('data-day') === '30.12.2099');
  expect(day).toBeDefined();
  await user.click(day!);
  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith(
      '/automation/issues/task/deactivation-schedule',
      { scheduledDeactivateAt: '2099-12-30' }
    )
  );
  expect(await screen.findByText('Geplant · 30.12.2099')).toBeInTheDocument();
});

it('shows the one-minute test button only when the API allows it', async () => {
  renderWithProviders(
    <TaskDeactivationSchedule taskId="task" disabled={false} />
  );
  await screen.findByText('Geplant · 31.12.2099');
  expect(
    screen.queryByRole('button', { name: 'In 1 Min. testen' })
  ).not.toBeInTheDocument();
});
it('schedules a one-minute test and shows its saved execution time', async () => {
  api.get.mockResolvedValue({
    data: { scheduledDeactivateAt: null, canTestSchedule: true },
  });
  api.patch.mockResolvedValue({
    data: {
      scheduledDeactivateAt: null,
      scheduledDeactivateTestAt: '2099-12-31T12:01:00Z',
      canTestSchedule: true,
    },
  });
  renderWithProviders(
    <TaskDeactivationSchedule taskId="task" disabled={false} />
  );
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: 'In 1 Min. testen' }));
  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith(
      '/automation/issues/task/deactivation-schedule',
      { testInOneMinute: true }
    )
  );
  expect(await screen.findByText(/Geplant · .*13:01:00/)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Test abbrechen' })
  ).toBeInTheDocument();
});
it('allows a persisted test to be cancelled after reopening the task', async () => {
  api.get.mockResolvedValue({
    data: {
      scheduledDeactivateAt: null,
      scheduledDeactivateTestAt: '2099-12-31T12:01:00Z',
      canTestSchedule: true,
    },
  });
  api.patch.mockResolvedValue({
    data: {
      scheduledDeactivateAt: null,
      scheduledDeactivateTestAt: null,
      canTestSchedule: true,
    },
  });
  renderWithProviders(
    <TaskDeactivationSchedule taskId="task" disabled={false} />
  );
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: 'Test abbrechen' }));
  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith(
      '/automation/issues/task/deactivation-schedule',
      { scheduledDeactivateAt: null }
    )
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Test abbrechen' })
    ).not.toBeInTheDocument()
  );
});
