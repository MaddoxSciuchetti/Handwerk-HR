import { BestandTab } from '@/features/bestand/BestandTab';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const stock = vi.hoisted(() => ({
  data: [] as { id: string; name: string; size: string; quantity: number }[],
  remove: vi.fn(),
  update: vi.fn(),
}));

beforeEach(() => {
  stock.data = [];
  stock.remove.mockReset().mockResolvedValue({ success: true });
  stock.update.mockReset();
});

vi.mock('@/features/bestand/useBestand', () => ({
  useClothingStock: () => ({
    data: stock.data,
    isLoading: false,
    isError: false,
  }),
  useDeleteClothingStockItem: () => ({
    mutateAsync: stock.remove,
    isPending: false,
  }),
  useUpdateClothingStockQuantity: () => ({
    mutate: stock.update,
    isPending: false,
  }),
  useCreateClothingStockItem: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('BestandTab', () => {
  it('keeps the stock form in a sidebar and drops helper copy', async () => {
    const user = userEvent.setup();
    render(<BestandTab />);

    expect(screen.queryByText(/Kleidung, die BSB/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Noch kein Bestand/)).not.toBeInTheDocument();
    expect(screen.getByTestId('bestand-add-sidebar')).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    await user.click(screen.getByTestId('open-bestand-add'));

    expect(screen.getByTestId('bestand-add-sidebar')).toHaveAttribute(
      'aria-hidden',
      'false'
    );
    expect(screen.getByLabelText('Artikel')).not.toHaveAttribute('placeholder');
    expect(screen.getByLabelText('Größe')).not.toHaveAttribute('placeholder');
    expect(screen.getByTestId('bestand-add-form')).toBeInTheDocument();
  });
});

it('selects stock without deleting it, then deletes only selected rows from the toolbar', async () => {
  stock.data = [
    { id: 'hose-s', name: 'Hose', size: 'S', quantity: 2 },
    { id: 'hose-m', name: 'Hose', size: 'M', quantity: 4 },
    { id: 'shirt', name: 'T-Shirt', size: 'L', quantity: 3 },
  ];
  const user = userEvent.setup();
  render(<BestandTab />);
  expect(
    screen.queryByRole('button', { name: /löschen/ })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Hose (S) auswählen' }));
  await user.click(screen.getByRole('button', { name: 'Hose (M) auswählen' }));
  expect(screen.getByText('2 ausgewählt')).toBeInTheDocument();
  expect(stock.remove).not.toHaveBeenCalled();
  expect(screen.getByTestId('bestand-row-hose-s')).toHaveAttribute(
    'data-selected',
    'true'
  );
  await user.click(
    screen.getByRole('button', { name: 'Ausgewählten Bestand löschen' })
  );
  await waitFor(() => expect(stock.remove).toHaveBeenCalledTimes(2));
  expect(stock.remove.mock.calls.map(([id]) => id)).toEqual([
    'hose-s',
    'hose-m',
  ]);
  expect(screen.queryByText('2 ausgewählt')).not.toBeInTheDocument();
});

it('keeps failed deletions selected and edits quantities independently of selection', async () => {
  stock.data = [
    { id: 'hose', name: 'Hose', size: 'S', quantity: 2 },
    { id: 'shirt', name: 'T-Shirt', size: 'L', quantity: 3 },
  ];
  stock.remove
    .mockResolvedValueOnce({ success: true })
    .mockRejectedValueOnce(new Error('Löschen fehlgeschlagen'));
  const user = userEvent.setup();
  render(<BestandTab />);
  const quantity = screen.getByRole('spinbutton', {
    name: 'Anzahl bei BSB für Hose',
  });
  await user.clear(quantity);
  await user.type(quantity, '5');
  await user.tab();
  expect(stock.update).toHaveBeenCalledWith(
    { id: 'hose', quantity: 5 },
    expect.any(Object)
  );
  expect(screen.queryByText('1 ausgewählt')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Hose (S) auswählen' }));
  await user.click(
    screen.getByRole('button', { name: 'T-Shirt (L) auswählen' })
  );
  await user.click(
    screen.getByRole('button', { name: 'Ausgewählten Bestand löschen' })
  );
  await waitFor(() =>
    expect(screen.getByText('1 ausgewählt')).toBeInTheDocument()
  );
  expect(
    screen.getByRole('button', {
      name: 'T-Shirt (L) aus der Auswahl entfernen',
    })
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    screen.getByRole('button', { name: 'Hose (S) auswählen' })
  ).toHaveAttribute('aria-pressed', 'false');
  await user.click(
    screen.getByRole('button', {
      name: 'T-Shirt (L) aus der Auswahl entfernen',
    })
  );
  expect(screen.queryByText('1 ausgewählt')).not.toBeInTheDocument();
});

it('keeps the stock headers and controls while replacing loading rows, then shows the data', () => {
  stock.data = [{ id: 'hose', name: 'Hose', size: 'S', quantity: 2 }];
  const view = render(<BestandTab isLoading />);
  expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  expect(
    screen.getByRole('columnheader', { name: 'Artikel' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('columnheader', { name: 'Größe' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('columnheader', { name: 'Anzahl bei BSB' })
  ).toBeInTheDocument();
  expect(screen.getByTestId('open-bestand-add')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Daten werden geladen');
  expect(screen.queryByTestId('bestand-row-hose')).not.toBeInTheDocument();
  view.rerender(<BestandTab />);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByTestId('bestand-row-hose')).toBeInTheDocument();
});
