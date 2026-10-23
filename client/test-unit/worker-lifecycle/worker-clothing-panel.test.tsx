import {
  clothingStockKey,
  useClothingStock,
} from '@/features/bestand/useBestand';
import { getClothingStock } from '@/features/bestand/bestand.api';
import WorkerEngagementInfoModal from '@/features/worker-lifecycle/components/WorkerEngagementInfoModal';
import WorkerClothingPanel from '@/features/worker-lifecycle/components/WorkerClothingPanel';
import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import { workerLifecycleQueries } from '@/features/worker-lifecycle/query-options/queries/worker-lifycycle.queries';
import {
  createEngagementClothing,
  getEngagementClothing,
} from '@/features/worker-task-management/api/engagementClothing.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/bestand/bestand.api', () => ({
  getClothingStock: vi.fn(),
}));
vi.mock('@/features/worker-task-management/api/engagementClothing.api', () => ({
  createEngagementClothing: vi.fn(),
  getEngagementClothing: vi.fn(),
}));

const engagements = [
  { id: 'eng-1', type: 'onboarding', startDate: '2026-01-01' },
] as WorkerDetailResponse['data']['engagements'];
const stockItem = {
  id: 'stock-1',
  name: 'Arbeitshose',
  size: 'M',
  quantity: 5,
};

function StockObserver() {
  const { data } = useClothingStock();
  return (
    <output aria-label="Verfügbarer Bestand">{data?.[0]?.quantity}</output>
  );
}

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <StockObserver />
      <WorkerClothingPanel workerId="worker-1" engagements={engagements} />
    </QueryClientProvider>
  );
  return client;
}

async function fillRow(quantity: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Zeile hinzufügen' }));
  await user.click(
    screen.getByRole('combobox', { name: 'Artikel aus Bestand' })
  );
  await user.click(
    await screen.findByRole('option', { name: 'Arbeitshose · M · 5 verfügbar' })
  );
  await user.clear(screen.getByLabelText('Anzahl'));
  await user.type(screen.getByLabelText('Anzahl'), quantity);
  return user;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getClothingStock).mockResolvedValue([{ ...stockItem }]);
  vi.mocked(getEngagementClothing).mockResolvedValue([]);
});

describe('worker information clothing', () => {
  it('saves the selected stock article and refreshes both allocation and Bestand', async () => {
    const allocated = {
      id: 'clothing-1',
      name: 'Arbeitshose',
      size: 'M',
      quantity: 2,
      returnedQuantity: 0,
      productUrl: null,
      source: 'storage' as const,
      stockItemId: 'stock-1',
    };
    vi.mocked(createEngagementClothing).mockImplementation(async () => {
      vi.mocked(getClothingStock).mockResolvedValue([
        { ...stockItem, quantity: 3 },
      ]);
      vi.mocked(getEngagementClothing).mockResolvedValue([allocated]);
      return allocated;
    });
    const client = renderPanel();
    await screen.findByText('Noch keine Kleidung ausgegeben.');
    const user = await fillRow('2');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() =>
      expect(createEngagementClothing).toHaveBeenCalledWith(
        'worker-1',
        'eng-1',
        { stockItemId: 'stock-1', quantity: 2 }
      )
    );
    expect(await screen.findByText('2 Stück')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByLabelText('Verfügbarer Bestand')).toHaveTextContent(
        '3'
      )
    );
    expect(client.getQueryData(clothingStockKey)).toEqual([
      { ...stockItem, quantity: 3 },
    ]);
    expect(
      screen.queryByRole('combobox', { name: 'Artikel aus Bestand' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Zeile hinzufügen' })
    ).toBeVisible();
  });

  it('keeps the row and stock intact if the server rejects an allocation', async () => {
    vi.mocked(createEngagementClothing).mockRejectedValue(
      new Error('Nicht genug Bestand.')
    );
    renderPanel();
    await screen.findByText('Noch keine Kleidung ausgegeben.');
    const user = await fillRow('2');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nicht genug Bestand.'
    );
    expect(screen.getByLabelText('Anzahl')).toHaveValue(2);
    expect(screen.getByLabelText('Verfügbarer Bestand')).toHaveTextContent('5');
  });

  it('does not allow quantities above the available stock', async () => {
    renderPanel();
    await screen.findByText('Noch keine Kleidung ausgegeben.');
    const user = await fillRow('6');
    expect(screen.getByLabelText('Anzahl')).toBeInvalid();
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(createEngagementClothing).not.toHaveBeenCalled();
  });

  it('adds another article row from the plus button and saves both', async () => {
    const shirt = { id: 'stock-2', name: 'T-Shirt', size: 'L', quantity: 4 };
    vi.mocked(getClothingStock).mockResolvedValue([{ ...stockItem }, shirt]);
    const hose = {
      id: 'clothing-1',
      name: 'Arbeitshose',
      size: 'M',
      quantity: 1,
      returnedQuantity: 0,
      productUrl: null,
      source: 'storage' as const,
      stockItemId: 'stock-1',
    };
    const top = {
      ...hose,
      id: 'clothing-2',
      name: 'T-Shirt',
      size: 'L',
      stockItemId: 'stock-2',
    };
    vi.mocked(createEngagementClothing).mockImplementation(async (_worker, _engagement, input) => {
      const saved = input.stockItemId === 'stock-2' ? top : hose;
      vi.mocked(getEngagementClothing).mockResolvedValue(
        input.stockItemId === 'stock-2' ? [hose, top] : [hose]
      );
      return saved;
    });
    renderPanel();
    await screen.findByText('Noch keine Kleidung ausgegeben.');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Zeile hinzufügen' }));
    await user.click(screen.getByRole('button', { name: 'Zeile hinzufügen' }));
    const combos = screen.getAllByRole('combobox', {
      name: 'Artikel aus Bestand',
    });
    expect(combos).toHaveLength(2);
    await user.click(combos[0]);
    await user.click(
      await screen.findByRole('option', { name: 'Arbeitshose · M · 5 verfügbar' })
    );
    await user.click(combos[1]);
    await user.click(
      await screen.findByRole('option', { name: 'T-Shirt · L · 4 verfügbar' })
    );
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() =>
      expect(createEngagementClothing).toHaveBeenCalledTimes(2)
    );
    expect(await screen.findByText('Arbeitshose')).toBeVisible();
    expect(screen.getByText('T-Shirt')).toBeVisible();
    expect(
      screen.queryByRole('combobox', { name: 'Artikel aus Bestand' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Zeile hinzufügen' })
    ).toBeVisible();
  });

  it('hides an article once the open rows use up its Bestand', async () => {
    vi.mocked(getClothingStock).mockResolvedValue([
      { ...stockItem, quantity: 1 },
    ]);
    renderPanel();
    await screen.findByText('Noch keine Kleidung ausgegeben.');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Zeile hinzufügen' }));
    await user.click(
      screen.getByRole('combobox', { name: 'Artikel aus Bestand' })
    );
    await user.click(
      await screen.findByRole('option', { name: 'Arbeitshose · M · 1 verfügbar' })
    );
    await user.click(screen.getByRole('button', { name: 'Zeile hinzufügen' }));
    const combos = screen.getAllByRole('combobox', {
      name: 'Artikel aus Bestand',
    });
    await user.click(combos[1]);
    expect(
      screen.queryByRole('option', { name: /Arbeitshose/ })
    ).not.toBeInTheDocument();
  });

  it('leaves only the plus button after the last row is removed', async () => {
    renderPanel();
    await screen.findByText('Noch keine Kleidung ausgegeben.');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Zeile hinzufügen' }));
    const addButton = screen.getByRole('button', { name: 'Zeile hinzufügen' });
    const article = screen.getByRole('combobox', { name: 'Artikel aus Bestand' });
    expect(
      addButton.compareDocumentPosition(article) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Zeile entfernen' }));
    expect(screen.getByText('Artikel')).toBeVisible();
    expect(
      screen.queryByRole('combobox', { name: 'Artikel aus Bestand' })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Anzahl')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Speichern' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zeile hinzufügen' }));
    expect(
      screen.getByRole('combobox', { name: 'Artikel aus Bestand' })
    ).toBeVisible();
  });

  it('shows the clothing dropdown on the information page', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(
      workerLifecycleQueries.workerById('worker-1').queryKey,
      {
        success: true,
        data: {
          id: 'worker-1',
          firstName: 'Ada',
          lastName: 'Eins',
          email: 'ada@example.com',
          engagements,
        },
      }
    );
    render(
      <QueryClientProvider client={client}>
        <WorkerEngagementInfoModal
          isOpen
          workerId="worker-1"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(await screen.findByText('Vorname')).toBeVisible();
    expect(screen.getByText('Artikel')).toBeVisible();
    expect(
      screen.queryByRole('combobox', { name: 'Artikel aus Bestand' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Zeile hinzufügen' })
    ).toBeVisible();
  });
});
