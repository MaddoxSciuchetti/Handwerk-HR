import { ClothingTab } from '@/features/worker-task-management/components/clothing/ClothingTab';
import WorkerHeader from '@/features/worker-task-management/components/header/WorkerHeader';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/bestand/useBestand', () => ({
  useClothingStock: () => ({ data: [] }),
}));

vi.mock('@/features/worker-task-management/hooks/useEngagementClothing', () => ({
  useEngagementClothing: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  useCreateEngagementClothing: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteEngagementClothing: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useReturnEngagementClothing: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const engagements = [
  { id: 'eng-1', type: 'onboarding' as const, startDate: '2026-01-01' },
];

describe('ClothingTab', () => {
  it('keeps the order form in a closed sidebar and drops helper copy', () => {
    render(
      <ClothingTab
        workerId="worker-1"
        engagements={engagements}
        addOpen={false}
        onAddOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByText(/Bestellte Kleidung/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kleidung wird geladen/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Noch keine Kleidung/)).not.toBeInTheDocument();
    expect(screen.getByTestId('clothing-add-sidebar')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(screen.queryByRole('button', { name: 'Hinzufügen' })).not.toBeInTheDocument();
  });

  it('shows the clothing fields in the sidebar without placeholder subtext', () => {
    render(
      <ClothingTab
        workerId="worker-1"
        engagements={engagements}
        addOpen
        onAddOpenChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('clothing-add-sidebar')).toHaveAttribute(
      'aria-hidden',
      'false'
    );
    expect(screen.getByLabelText('Bezeichnung')).not.toHaveAttribute('placeholder');
    expect(screen.getByLabelText('Größe')).not.toHaveAttribute('placeholder');
    expect(screen.getByLabelText('Link')).not.toHaveAttribute('placeholder');
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeInTheDocument();
  });
});

describe('WorkerHeader clothing action', () => {
  it('opens clothing from the header without extra copy', () => {
    render(
      <WorkerHeader
        activeTab="clothing"
        openForCreate={vi.fn()}
        onOpenFileUpload={vi.fn()}
        onExportFiles={vi.fn()}
        onUploadMaterials={vi.fn()}
        onAddClothing={vi.fn()}
      />
    );

    expect(screen.getByText('Kleidung')).toBeInTheDocument();
    expect(screen.getByTestId('open-clothing-add')).toHaveTextContent('Hinzufügen');
    expect(screen.queryByText(/Bestellte Kleidung/)).not.toBeInTheDocument();
  });
});
