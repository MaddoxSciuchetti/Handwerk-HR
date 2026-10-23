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

it('shows and opens filed questionnaire attachments only for the selected engagement', async () => {
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
  const props = {
    workerId: 'worker',
    engagements: [
      { id: 'engagement', type: 'onboarding' as const, startDate: null },
      { id: 'other', type: 'onboarding' as const, startDate: null },
    ],
    documents: [
      attachment,
      {
        ...attachment,
        id: 'other-file',
        engagementId: 'other',
        originalFileName: 'other.png',
      },
    ],
    folders: [],
    questionnaires: [],
    contracts: [],
    certificates: [],
    deletingId: null,
    onDelete: vi.fn(),
    engagementId: 'engagement',
    onEngagementChange: vi.fn(),
  };
  const view = renderWithProviders(<PersonnelDocumentFolders {...props} />);
  expect(
    screen.queryByRole('button', { name: 'other.png öffnen' })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'kk.png öffnen' }));
  expect(open).toHaveBeenCalledWith(attachment.presignedUrl, '_blank');

  view.rerender(<PersonnelDocumentFolders {...props} engagementId="other" />);
  expect(
    screen.queryByRole('button', { name: 'kk.png öffnen' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'other.png öffnen' })
  ).toBeVisible();
  open.mockRestore();
});
