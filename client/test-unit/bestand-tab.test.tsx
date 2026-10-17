import { BestandTab } from '@/features/bestand/BestandTab';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/bestand/useBestand', () => ({
  useClothingStock: () => ({
    data: [],
    isLoading: false,
    isError: false,
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
