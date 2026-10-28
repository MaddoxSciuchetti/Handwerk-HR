import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';
import { PersonnelDocumentFolders } from '@/features/worker-task-management/components/files/personnel/PersonnelDocumentFolders';
import type { PersonnelDocument } from '@/features/worker-task-management/api/personnelDocuments.api';

vi.mock(
  '@/features/worker-task-management/components/files/EngagementTemplateDocuments',
  () => ({
    EngagementTemplateDocuments: () => null,
  })
);

it('shows and opens filed questionnaire attachments from every engagement', async () => {
  const user = userEvent.setup();
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  const attachment: PersonnelDocument = {
    id: 'attachment',
    engagementId: 'engagement',
    folderId: null,
    name: 'fragebogen',
    label: 'Fragebogen',
    originalFileName: 'kk.png',
    mimeType: 'image/png',
    fileSizeBytes: 123,
    createdAt: '2026-10-23',
    presignedUrl: 'https://example.test/kk.png',
  };
  const otherUrl = 'https://example.test/other.png';
  renderWithProviders(
    <PersonnelDocumentFolders
      workerId="worker"
      engagements={[
        { id: 'engagement', type: 'onboarding', startDate: null },
        { id: 'other', type: 'onboarding', startDate: null },
      ]}
      documents={[
        attachment,
        {
          ...attachment,
          id: 'other-file',
          engagementId: 'other',
          originalFileName: 'other.png',
          presignedUrl: otherUrl,
        },
      ]}
      folders={[]}
      questionnaires={[]}
      contracts={[]}
      certificates={[]}
      deletingId={null}
      onDelete={vi.fn()}
    />
  );
  expect(
    screen.getByRole('button', { name: 'other.png öffnen' })
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'kk.png öffnen' }));
  expect(open).toHaveBeenCalledWith(attachment.presignedUrl, '_blank');
  await user.click(screen.getByRole('button', { name: 'other.png öffnen' }));
  expect(open).toHaveBeenCalledWith(otherUrl, '_blank');
  open.mockRestore();
});
