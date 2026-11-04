import type { PersonnelDocument } from '@/features/worker-task-management/api/personnelDocuments.api';
import { PersonnelDocumentFolders } from '@/features/worker-task-management/components/files/personnel/PersonnelDocumentFolders';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { expect, it, vi } from 'vitest';
import {
  uploadPersonnelDocument,
  movePersonnelDocument,
  deletePersonnelFolder,
} from '@/features/worker-task-management/api/personnelDocuments.api';

vi.mock('@/features/worker-task-management/api/personnelDocuments.api', () => ({
  uploadPersonnelDocument: vi.fn().mockResolvedValue({}),
  movePersonnelDocument: vi.fn().mockResolvedValue({}),
  deletePersonnelFolder: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/features/worker-task-management/hooks/useTemplateDocuments', () => ({
  useTemplateDocuments: () => ({ data: [] }),
  useCreateTemplateDocument: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateTemplateDocuments: () => ({ mutate: vi.fn(), isPending: false }),
  useSyncTemplateDocuments: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTemplateDocument: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: undefined,
  }),
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
  expect(
    screen.queryByText('Datei hierher oder in einen anderen Ordner ziehen')
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', {
      name: 'Zurück zu allen Ordnern, Personalausweis',
    })
  ).toBeInTheDocument();
});

it('uploads dropped files into built-in, custom, and open folders', async () => {
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
      engagement.id,
      {
        engagementId: engagement.id,
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

const storedDocument = {
  id: 'document-1',
  engagementId: engagement.id,
  folderId: null,
  name: 'fragebogen' as const,
  label: 'Fragebogen',
  originalFileName: 'personal.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 100,
  createdAt: '2026-10-01',
  presignedUrl: 'https://example.test/personal.pdf',
};
function renderLibrary(
  documents: PersonnelDocument[] = [storedDocument],
  hiddenFolders: string[] = []
) {
  return renderWithProviders(
    <PersonnelDocumentFolders
      workerId="worker"
      engagements={[engagement]}
      documents={documents}
      folders={[
        { id: 'folder-1', engagementId: engagement.id, label: 'Zeugnisse' },
      ]}
      hiddenFolders={hiddenFolders}
      questionnaires={[]}
      contracts={[]}
      certificates={[]}
      deletingId={null}
      onDelete={vi.fn()}
    />
  );
}

it('moves existing personnel and legacy files into folders without uploading again', async () => {
  vi.mocked(movePersonnelDocument).mockClear();
  renderLibrary();
  const transfer = { setData: vi.fn(), effectAllowed: 'none' };
  fireEvent.dragStart(
    screen.getByText('personal.pdf').closest('[draggable]')!,
    { dataTransfer: transfer }
  );
  const storedPayload = JSON.stringify({
    id: storedDocument.id,
    source: 'personnel',
    engagementId: engagement.id,
  });
  expect(transfer.setData).toHaveBeenCalledWith(
    'application/x-handwerk-file',
    storedPayload
  );
  expect(transfer.setData).toHaveBeenCalledWith(
    'text/plain',
    `handwerk-file:${storedPayload}`
  );
  const dataTransfer = {
    types: ['application/x-handwerk-file'],
    files: [],
    getData: (type: string) =>
      type === 'application/x-handwerk-file' ? storedPayload : '',
    dropEffect: 'none',
  };
  const folder = screen.getByRole('button', { name: 'Zeugnisse' });
  fireEvent.dragOver(folder, { dataTransfer });
  expect(dataTransfer.dropEffect).toBe('move');
  fireEvent.drop(folder, { dataTransfer });
  await waitFor(() =>
    expect(movePersonnelDocument).toHaveBeenCalledWith('worker', {
      documentId: 'document-1',
      source: 'personnel',
      engagementId: engagement.id,
      name: 'ordner',
      folderId: 'folder-1',
    })
  );
  fireEvent.drop(folder, {
    dataTransfer: {
      ...dataTransfer,
      getData: () => JSON.stringify({ id: 'legacy-1', source: 'worker' }),
    },
  });
  await waitFor(() =>
    expect(movePersonnelDocument).toHaveBeenCalledWith('worker', {
      documentId: 'legacy-1',
      source: 'worker',
      engagementId: engagement.id,
      name: 'ordner',
      folderId: 'folder-1',
    })
  );
});

it('still moves a file when the browser only exposes text/plain during dragover', async () => {
  vi.mocked(movePersonnelDocument).mockClear();
  renderLibrary();
  const transfer = { setData: vi.fn(), effectAllowed: 'none' };
  fireEvent.dragStart(
    screen.getByText('personal.pdf').closest('[draggable]')!,
    { dataTransfer: transfer }
  );
  const storedPayload = JSON.stringify({
    id: storedDocument.id,
    source: 'personnel',
    engagementId: engagement.id,
  });
  const dataTransfer = {
    types: ['text/plain'],
    files: [],
    getData: (type: string) =>
      type === 'text/plain' ? `handwerk-file:${storedPayload}` : '',
    dropEffect: 'none',
  };
  const folder = screen.getByRole('button', { name: 'Zeugnisse' });
  fireEvent.dragOver(folder, { dataTransfer });
  expect(dataTransfer.dropEffect).toBe('move');
  fireEvent.drop(folder, { dataTransfer });
  await waitFor(() =>
    expect(movePersonnelDocument).toHaveBeenCalledWith('worker', {
      documentId: 'document-1',
      source: 'personnel',
      engagementId: engagement.id,
      name: 'ordner',
      folderId: 'folder-1',
    })
  );
});

it('moves a file from an open folder into another folder by dropping on it', async () => {
  vi.mocked(movePersonnelDocument).mockClear();
  renderLibrary([
    {
      ...storedDocument,
      id: 'in-folder',
      name: 'ordner',
      folderId: 'folder-1',
      originalFileName: 'zeugnis.pdf',
    },
  ]);
  await userEvent.click(screen.getByRole('button', { name: 'Zeugnisse' }));
  expect(screen.getByText('zeugnis.pdf')).toBeInTheDocument();
  expect(
    screen.getByRole('button', {
      name: 'Zurück zu allen Ordnern, Zeugnisse',
    })
  ).toBeInTheDocument();
  const transfer = { setData: vi.fn(), effectAllowed: 'none' };
  fireEvent.dragStart(screen.getByText('zeugnis.pdf').closest('[draggable]')!, {
    dataTransfer: transfer,
  });
  const storedPayload = transfer.setData.mock.calls[0][1] as string;
  const dataTransfer = {
    types: ['application/x-handwerk-file'],
    files: [],
    getData: (type: string) =>
      type === 'application/x-handwerk-file' ? storedPayload : '',
    dropEffect: 'none',
  };
  const identityFolder = screen.getByRole('button', {
    name: 'Personalausweis',
  });
  fireEvent.drop(identityFolder, { dataTransfer });
  await waitFor(() =>
    expect(movePersonnelDocument).toHaveBeenCalledWith('worker', {
      documentId: 'in-folder',
      source: 'personnel',
      engagementId: engagement.id,
      name: 'personalausweis',
      folderId: undefined,
    })
  );
});

it('confirms deletion of a non-empty folder and supports cancelling', async () => {
  vi.mocked(deletePersonnelFolder).mockClear();
  renderLibrary([{ ...storedDocument, folderId: 'folder-1' }]);
  await userEvent.click(
    screen.getByRole('button', { name: 'Zeugnisse löschen' })
  );
  expect(
    screen.getByRole('dialog', { name: 'Ordner löschen?' })
  ).toHaveTextContent('alle enthaltenen Dateien');
  expect(deletePersonnelFolder).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
  expect(deletePersonnelFolder).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Zeugnisse löschen' })
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Ordner und Dateien löschen' })
  );
  await waitFor(() =>
    expect(deletePersonnelFolder).toHaveBeenCalledWith(
      'worker',
      'folder-1',
      true
    )
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
});

it('deletes empty folders immediately and keeps deleted default folders hidden', async () => {
  vi.mocked(deletePersonnelFolder).mockClear();
  renderLibrary([], ['personalausweis']);
  expect(
    screen.queryByRole('button', { name: 'Personalausweis' })
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Zeugnisse löschen' })
  );
  await waitFor(() =>
    expect(deletePersonnelFolder).toHaveBeenCalledWith(
      'worker',
      'folder-1',
      false
    )
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('deletes individual files with the hover control without opening them', async () => {
  const onDelete = vi.fn();
  renderWithProviders(
    <PersonnelDocumentFolders
      workerId="worker"
      engagements={[engagement]}
      documents={[storedDocument]}
      folders={[]}
      questionnaires={[]}
      contracts={[]}
      certificates={[]}
      deletingId={null}
      onDelete={onDelete}
    />
  );
  const button = screen.getByRole('button', { name: 'Fragebogen löschen' });
  expect(button).toHaveClass(
    'group-hover:opacity-100',
    'group-focus-within:opacity-100'
  );
  await userEvent.click(button);
  expect(onDelete).toHaveBeenCalledWith('document-1');
});
