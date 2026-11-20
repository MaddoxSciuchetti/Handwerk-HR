import { screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';
import { PersonnelDocumentFolders } from '@/features/worker-task-management/components/files/personnel/PersonnelDocumentFolders';
import type { PersonnelDocument } from '@/features/worker-task-management/api/personnelDocuments.api';
import { clearStoredFilePrintCache } from '@/features/worker-task-management/printStoredFile';

vi.mock(
  '@/features/worker-task-management/components/files/EngagementTemplateDocuments',
  () => ({
    EngagementTemplateDocuments: () => null,
  })
);

afterEach(() => {
  clearStoredFilePrintCache();
  vi.unstubAllGlobals();
});

it('shows and opens filed questionnaire attachments from every engagement', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['x'], { type: 'image/png' }),
    })
  );
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
  const kk = screen.getByRole('link', { name: 'kk.png öffnen' });
  const other = screen.getByRole('link', { name: 'other.png öffnen' });
  expect(other).toBeVisible();
  expect(kk).toHaveAttribute('href', attachment.presignedUrl);
  expect(kk).toHaveAttribute('target', '_blank');
  expect(other).toHaveAttribute('href', otherUrl);
  expect(other).toHaveAttribute('target', '_blank');
});
