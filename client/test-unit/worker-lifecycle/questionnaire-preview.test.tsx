import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import WorkerInformation from '@/features/worker-lifecycle/components/WorkerInformation';
import { getWorkerById } from '@/features/worker-task-management/api/index.api';

vi.mock('@/features/worker-task-management/api/index.api', () => ({
  getWorkerById: vi.fn(),
}));

it('shows editable questionnaire dates, address and position on the worker information tab', async () => {
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
      <WorkerInformation workerId="worker" />
    </QueryClientProvider>
  );
  expect(await screen.findByLabelText('Geburtsdatum')).toHaveValue(
    '1992-03-04'
  );
  expect(screen.getByLabelText('Straße und Hausnummer')).toHaveValue(
    'Musterstraße 12'
  );
  expect(screen.getByLabelText('Postleitzahl')).toHaveValue('10115');
  expect(screen.getByLabelText('Ort')).toHaveValue('Berlin');
  expect(screen.getByLabelText('Eintrittsdatum')).toHaveValue('2026-11-01');
  expect(screen.getByLabelText('Position')).toHaveValue('Monteur');
});
