import { PersonnelDocumentFolders } from '@/features/worker-task-management/components/files/personnel/PersonnelDocumentFolders';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { expect, it } from 'vitest';

const engagement = {
  id: 'engagement-1',
  type: 'onboarding' as const,
  startDate: '2026-10-01',
};

it('shows the questionnaire, contract, and folders as file boxes', async () => {
  renderWithProviders(
    <PersonnelDocumentFolders
      workerId="worker"
      engagements={[engagement]}
      documents={[]}
      folders={[{ id: 'folder-1', engagementId: engagement.id, label: 'Zeugnisse' }]}
      questionnaires={[
        {
          id: 'questionnaire-1',
          engagementId: engagement.id,
          name: 'Personalfragebogen',
          engagementLabel: 'Eintritt · 01.10.2026',
          completedAt: '2026-10-17T00:00:00.000Z',
        },
      ]}
      contracts={[
        {
          id: 'contract-1',
          engagementId: engagement.id,
          name: '1791894186717-dad01426-033a-4b32-9139-c3e328f94c61',
          status: 'draft',
        },
      ]}
      certificates={[]}
      deletingId={null}
      onDelete={() => undefined}
    />
  );

  expect(screen.getByRole('button', { name: 'Fragebogen' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vertrag' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Personalausweis' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Zeugnisse' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ordner hinzufügen' })).toBeInTheDocument();
  expect(screen.queryByText('Leer')).not.toBeInTheDocument();
  expect(screen.queryByText('Personalfragebogen')).not.toBeInTheDocument();
  expect(screen.queryByText(/Ausgefüllt/)).not.toBeInTheDocument();
  expect(screen.queryByText(/1791894186717/)).not.toBeInTheDocument();
  expect(screen.queryByText('Entwurf')).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Personalausweis' }));

  expect(screen.queryByText('Leer')).not.toBeInTheDocument();
  expect(screen.queryByText('Keine Datei')).not.toBeInTheDocument();
  expect(screen.queryByText(/Datei/)).not.toBeInTheDocument();
});
