import { PersonnelDocumentFolders } from '@/features/worker-task-management/components/files/personnel/PersonnelDocumentFolders';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { expect, it, vi } from 'vitest';
import { uploadPersonnelDocument } from '@/features/worker-task-management/api/personnelDocuments.api';

vi.mock('@/features/worker-task-management/api/personnelDocuments.api', () => ({
  uploadPersonnelDocument: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/features/worker-task-management/hooks/useTemplateDocuments', () => ({
  useTemplateDocuments: () => ({ data: [] }),
  useCreateTemplateDocument: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/features/settings/documents/useDocumentMasters', () => ({
  useDocumentMasters: () => ({ data: [], isPending: false, isError: false }),
}));

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
      folders={[
        { id: 'folder-1', engagementId: engagement.id, label: 'Zeugnisse' },
      ]}
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
      engagementId={engagement.id}
      onEngagementChange={() => undefined}
    />
  );

  expect(
    screen.getByRole('button', { name: 'Fragebogen' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vertrag' })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Personalausweis' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Zeugnisse' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Hinzufügen' })
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Leer')).not.toBeInTheDocument();
  expect(screen.queryByText('Personalfragebogen')).not.toBeInTheDocument();
  expect(screen.queryByText(/Ausgefüllt/)).not.toBeInTheDocument();
  expect(screen.queryByText(/1791894186717/)).not.toBeInTheDocument();
  expect(screen.queryByText('Entwurf')).not.toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', { name: 'Personalausweis' })
  );

  expect(screen.queryByText('Leer')).not.toBeInTheDocument();
  expect(screen.queryByText('Keine Datei')).not.toBeInTheDocument();
  expect(screen.queryByText(/Datei/)).not.toBeInTheDocument();
});

it('uploads dropped files into built-in, custom, and open folders for the selected engagement', async () => {
  vi.mocked(uploadPersonnelDocument).mockClear();
  renderWithProviders(
    <PersonnelDocumentFolders
      workerId="worker"
      engagements={[engagement, { ...engagement, id: 'engagement-2' }]}
      documents={[]}
      folders={[
        { id: 'folder-2', engagementId: 'engagement-2', label: 'Zeugnisse' },
      ]}
      questionnaires={[]}
      contracts={[]}
      certificates={[]}
      deletingId={null}
      onDelete={vi.fn()}
      engagementId="engagement-2"
      onEngagementChange={vi.fn()}
    />
  );
  const files = [
    new File(['front'], 'front.pdf', { type: 'application/pdf' }),
    new File(['back'], 'back.png', { type: 'image/png' }),
  ];
  const dataTransfer = { files, types: ['Files'], dropEffect: 'none' };
  const identityFolder = screen.getByRole('button', {
    name: 'Personalausweis',
  });
  fireEvent.dragEnter(identityFolder, { dataTransfer });
  expect(identityFolder).toHaveClass('bg-muted/50');
  fireEvent.drop(identityFolder, { dataTransfer });
  expect(identityFolder).not.toHaveClass('bg-muted/50');
  await waitFor(() => expect(uploadPersonnelDocument).toHaveBeenCalledTimes(2));
  for (const file of files) {
    expect(uploadPersonnelDocument).toHaveBeenCalledWith(
      'worker',
      'engagement-2',
      {
        engagementId: 'engagement-2',
        name: 'personalausweis',
        folderId: undefined,
        file,
      }
    );
  }
  const customFolder = screen.getByRole('button', { name: 'Zeugnisse' });
  fireEvent.drop(customFolder, {
    dataTransfer: { ...dataTransfer, files: [files[0]] },
  });
  await waitFor(() => expect(uploadPersonnelDocument).toHaveBeenCalledTimes(3));
  expect(uploadPersonnelDocument).toHaveBeenLastCalledWith(
    'worker',
    'engagement-2',
    {
      engagementId: 'engagement-2',
      name: 'ordner',
      folderId: 'folder-2',
      file: files[0],
    }
  );
  await userEvent.click(customFolder);
  fireEvent.drop(screen.getByText('Zeugnisse'), {
    dataTransfer: { ...dataTransfer, files: [files[1]] },
  });
  await waitFor(() => expect(uploadPersonnelDocument).toHaveBeenCalledTimes(4));
  expect(uploadPersonnelDocument).toHaveBeenLastCalledWith(
    'worker',
    'engagement-2',
    {
      engagementId: 'engagement-2',
      name: 'ordner',
      folderId: 'folder-2',
      file: files[1],
    }
  );
});
