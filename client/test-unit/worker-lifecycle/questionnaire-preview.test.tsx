import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import WorkerEngagementInfoModal from '@/features/worker-lifecycle/components/WorkerEngagementInfoModal';
import { getWorkerById } from '@/features/worker-task-management/api/index.api';

vi.mock('@/features/worker-task-management/api/index.api', () => ({
  getWorkerById: vi.fn(),
}));

it('shows questionnaire dates, full address and position in the worker information preview', async () => {
  vi.mocked(getWorkerById).mockResolvedValue({
    success: true,
    data: {
      id: 'worker',
      firstName: 'Lukas',
      lastName: 'Muster',
      email: 'lukas@example.test',
      workEmail: null,
      birthday: '1992-03-04T00:00:00.000Z',
      street: 'Musterstraße 12',
      postalCode: '10115',
      city: 'Berlin',
      state: null,
      country: null,
      position: 'Monteur',
      entryDate: '2026-11-01T00:00:00.000Z',
      exitDate: null,
      engagements: [],
    },
  });
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={query}>
      <WorkerEngagementInfoModal
        isOpen
        workerId="worker"
        onClose={() => undefined}
      />
    </QueryClientProvider>
  );
  expect(await screen.findByText('04.03.1992')).toBeInTheDocument();
  expect(screen.getByText('Musterstraße 12, 10115 Berlin')).toBeInTheDocument();
  expect(screen.getByText('01.11.2026')).toBeInTheDocument();
  expect(screen.getByText('Monteur')).toBeInTheDocument();
});
