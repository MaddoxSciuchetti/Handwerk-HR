import { useState } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';
import WorkerHeader from '@/features/worker-task-management/components/header/WorkerHeader';
import WorkerFileUploads from '@/features/worker-task-management/components/files/WorkerFileUploads';
import { createWorkerFile } from '@/apis/index.apis';

vi.mock('@/apis/index.apis', () => ({
  createWorkerFile: vi.fn().mockResolvedValue({ success: true }),
}));

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
          onAddFolder={() => undefined}
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
          createFolderOpen={false}
          setCreateFolderOpen={() => undefined}
        />
      </>
    );
  }
  const user = userEvent.setup();
  renderWithProviders(<Harness />);
  await user.click(screen.getByRole('button', { name: 'Exportieren' }));
  expect(exportFiles).toHaveBeenCalledOnce();
  await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
  await user.click(screen.getByRole('menuitem', { name: 'Datei' }));
  const panel = screen.getByRole('dialog', { name: 'Datei hochladen' });
  expect(panel).toHaveAttribute('data-slot', 'sheet-content');
  expect(panel).toHaveAttribute('data-side', 'right');
  const nameInput = within(panel).getByRole('textbox', {
    name: 'Dokumentname',
  });
  expect(
    within(panel).queryByRole('combobox', { name: 'Dokumentname' })
  ).not.toBeInTheDocument();
  await user.type(nameInput, '  Schulungsnachweis  ');
  expect(nameInput).toHaveValue('  Schulungsnachweis  ');
  const file = new File(['document'], 'identity.pdf', {
    type: 'application/pdf',
  });
  await user.upload(within(panel).getByLabelText('Datei auswählen'), file);
  expect(within(panel).getByText('identity.pdf')).toBeInTheDocument();
  await user.click(within(panel).getByRole('button', { name: 'Hochladen' }));
  await waitFor(() => expect(createWorkerFile).toHaveBeenCalledOnce());
  const [files, workerId] = vi.mocked(createWorkerFile).mock.calls[0];
  expect(workerId).toBe('worker');
  expect(files).toHaveLength(1);
  expect(files[0].name).toBe('Schulungsnachweis.pdf');
  expect(files[0].type).toBe('application/pdf');
  expect(files[0].size).toBe(file.size);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
});
