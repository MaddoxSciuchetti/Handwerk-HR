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
it('opens the calendar when enabling scheduling', async () => {
  function Harness() {
    const [value, setValue] = useState<string | null>(null);
    return <DeactivationScheduleField value={value} onChange={setValue} />;
  }
  render(<Harness />);
  const user = userEvent.setup();
  expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  await user.click(screen.getByRole('switch', { name: 'Planen' }));
  expect(screen.getByRole('grid')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('switch', { name: 'Planen' })).not.toBeChecked();
  expect(screen.queryByRole('grid')).not.toBeInTheDocument();
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
it('asks for a date as soon as scheduling is enabled in the sidebar', async () => {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const displayDate = new Date(`${date}T12:00:00`).toLocaleDateString('de');
  api.get.mockResolvedValue({ data: { scheduledDeactivateAt: null } });
  api.patch.mockResolvedValue({
    data: { scheduledDeactivateAt: date },
  });
  renderWithProviders(
    <TaskDeactivationSchedule taskId="task" disabled={false} />
  );
  const user = userEvent.setup();
  await screen.findByRole('switch', { name: 'Planen' });
  await user.click(screen.getByRole('switch', { name: 'Planen' }));
  expect(screen.getByRole('grid')).toBeInTheDocument();
  const day = screen
    .getAllByRole('button')
    .find((button) => button.getAttribute('data-day') === displayDate);
  expect(day).toBeDefined();
  await user.click(day!);
  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith(
      '/automation/issues/task/deactivation-schedule',
      { scheduledDeactivateAt: date }
    )
  );
});
