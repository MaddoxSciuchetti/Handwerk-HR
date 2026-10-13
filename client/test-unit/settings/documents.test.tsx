import { AddDocumentMasterDialog } from '@/features/settings/documents/AddDocumentMasterDialog';
import { DocumentMasterList } from '@/features/settings/documents/DocumentMasterList';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('document settings', () => {
  it('chooses the new document type from a dropdown containing Arbeitszeugnis', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddDocumentMasterDialog onClose={vi.fn()} />);

    const typeSelect = screen.getByRole('combobox', { name: 'Art' });
    expect(typeSelect).toHaveTextContent('Arbeitsvertrag');

    await user.click(typeSelect);
    expect(
      await screen.findByRole('option', { name: 'Arbeitszeugnis' })
    ).toBeInTheDocument();
  });

  it('shows each document type as a rounded tag in the list', () => {
    renderWithProviders(
      <DocumentMasterList
        masters={[
          {
            id: 'master-1',
            name: 'Qualifiziertes Zeugnis',
            kind: 'arbeitszeugnis',
            updatedAt: '2026-10-11T00:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getByText('Arbeitszeugnis')).toHaveClass('rounded-full');
  });
});
