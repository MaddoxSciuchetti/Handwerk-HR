import { useState } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';
import WorkerHeader from '@/features/worker-task-management/components/header/WorkerHeader';
import WorkerFileUploads from '@/features/worker-task-management/components/files/WorkerFileUploads';
import { uploadPersonnelDocument } from '@/features/worker-task-management/api/personnelDocuments.api';

vi.mock('@/features/worker-task-management/hooks/useGetWorkerFiles', () => ({
  default: () => ({ fetchFiles: [], isLoading: false, isError: false }),
}));
vi.mock('@/features/worker-task-management/hooks/useDeleteWorkerFile', () => ({
  default: () => ({ deleteFiles: vi.fn() }),
}));
vi.mock(
  '@/features/worker-task-management/components/files/personnel/PersonnelDocumentFolders',
  () => ({
    PersonnelDocumentFolders: () => null,
  })
);
vi.mock('@/features/worker-task-management/api/personnelDocuments.api', () => ({
  getPersonnelDocuments: vi
    .fn()
    .mockResolvedValue({ documents: [], folders: [] }),
  uploadPersonnelDocument: vi.fn().mockResolvedValue({}),
  deletePersonnelDocument: vi.fn(),
  createPersonnelFolder: vi.fn(),
}));

it('opens the upload side panel from the header and uploads the chosen document', async () => {
  const exportFiles = vi.fn();
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <WorkerHeader
          activeTab="files"
          openForCreate={vi.fn()}
          onOpenFileUpload={() => setOpen(true)}
          onExportFiles={exportFiles}
          onUploadMaterials={vi.fn()}
          onAddClothing={vi.fn()}
        />
        <WorkerFileUploads
          workerId="worker"
          engagements={[
            { id: 'engagement', type: 'onboarding', startDate: null },
          ]}
          contracts={[]}
          certificates={[]}
          isUploadModalOpen={open}
          setIsUploadModalOpen={setOpen}
        />
      </>
    );
  }
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  await user.click(screen.getByRole('button', { name: 'Exportieren' }));
  expect(exportFiles).toHaveBeenCalledOnce();
  await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
  const panel = screen.getByRole('dialog', { name: 'Datei hochladen' });
  expect(panel).toHaveAttribute('data-slot', 'sheet-content');
  expect(panel).toHaveAttribute('data-side', 'right');
  await user.click(
    within(panel).getByRole('combobox', { name: 'Dokumentname' })
  );
  expect(panel).toBeVisible();
  expect(within(panel).getByText('Datei hochladen')).toBeVisible();
  await user.click(
    await screen.findByRole('option', { name: 'Personalausweis' })
  );
  expect(panel).toBeVisible();
  expect(
    within(panel).getByRole('combobox', { name: 'Dokumentname' })
  ).toHaveTextContent('Personalausweis');
  const file = new File(['document'], 'identity.pdf', {
    type: 'application/pdf',
  });
  await user.upload(within(panel).getByLabelText('Datei auswählen'), file);
  expect(within(panel).getByText('identity.pdf')).toBeInTheDocument();
  await user.click(within(panel).getByRole('button', { name: 'Hochladen' }));
  await waitFor(() =>
    expect(uploadPersonnelDocument).toHaveBeenCalledWith(
      'worker',
      'engagement',
      {
        engagementId: 'engagement',
        name: 'personalausweis',
        folderId: undefined,
        file,
      }
    )
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
});
