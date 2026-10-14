import { AddDocumentMasterDialog } from '@/features/settings/documents/AddDocumentMasterDialog';
import { DocumentMasterList } from '@/features/settings/documents/DocumentMasterList';
import { DocumentsPage } from '@/features/settings/documents/DocumentsPage';
import { setPrimaryDocumentMaster } from '@/features/settings/documents/documentMasters.api';
import { listDocumentMasters } from '@/features/settings/documents/documentMasters.api';
import { fromSegments } from '@/features/settings/documents/styledDocument';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/features/settings/documents/documentMasters.api', () => ({
  listDocumentMasters: vi.fn(),
  setPrimaryDocumentMaster: vi.fn(),
}));

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
            isPrimary: false,
            updatedAt: '2026-10-11T00:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getByText('Arbeitszeugnis')).toHaveClass('rounded-full');
  });

  it('marks one employment contract as the template used for sending', async () => {
    const user = userEvent.setup();
    const masters = [
      {
        id: 'current',
        name: 'Rahmenvertrag',
        kind: 'employment_contract' as const,
        isPrimary: true,
        updatedAt: '2026-10-11T00:00:00.000Z',
      },
      {
        id: 'next',
        name: 'Saisonvertrag',
        kind: 'employment_contract' as const,
        isPrimary: false,
        updatedAt: '2026-10-12T00:00:00.000Z',
      },
    ];
    vi.mocked(listDocumentMasters).mockResolvedValue(masters);
    vi.mocked(setPrimaryDocumentMaster).mockImplementation(async (id) => {
      masters.forEach((master) => {
        master.isPrimary = master.id === id;
      });
      return {
        ...masters.find((master) => master.id === id)!,
        text: '',
        segments: [],
        document: fromSegments([]),
        revision: 1,
        approvedAt: null,
      };
    });

    renderWithProviders(<DocumentsPage />);

    expect(
      await screen.findByRole('radio', {
        name: 'Rahmenvertrag als primären Mustervertrag für den Versand verwenden',
      })
    ).toBeChecked();
    expect(screen.getByText('Für den Versand')).toBeInTheDocument();

    await user.click(
      screen.getByRole('radio', {
        name: 'Saisonvertrag als primären Mustervertrag für den Versand verwenden',
      })
    );

    expect(setPrimaryDocumentMaster).toHaveBeenCalledWith('next');
    expect(
      await screen.findByRole('radio', {
        name: 'Saisonvertrag als primären Mustervertrag für den Versand verwenden',
      })
    ).toBeChecked();
    expect(navigate).not.toHaveBeenCalled();
  });
});
