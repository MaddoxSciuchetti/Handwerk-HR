import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { updateDocumentMaster } from '@/features/settings/documents/documentMasters.api';
import { useSaveDocumentMaster } from '@/features/settings/documents/useSaveDocumentMaster';
import type { DocumentMasterDetail } from '@/features/settings/documents/documentMaster.types';

vi.mock('@/features/settings/documents/documentMasters.api', () => ({
  updateDocumentMaster: vi.fn(),
}));

it('preserves the upload URL and invalidates only unsent children of the saved master', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  });
  const saved = {
    id: 'master',
    revision: 4,
    name: 'Contract',
  } as DocumentMasterDetail;
  client.setQueryData(['document-masters', 'master'], {
    ...saved,
    revision: 3,
    sourceUrl: '/original.pdf',
  });
  const draftKey = ['employment-contract', 'worker', 'eng'];
  const otherKey = ['employment-contract', 'worker', 'other'];
  const signedKey = ['employment-contract', 'worker', 'signed'];
  const templateKey = ['template-document', 'worker', 'eng', 'doc'];
  const values = { pay: '4000' };
  client.setQueryData(draftKey, { masterId: 'master', values });
  client.setQueryData(otherKey, { masterId: 'other' });
  client.setQueryData(signedKey, { masterId: 'master', status: 'signed' });
  client.setQueryData(templateKey, { masterId: 'master' });
  vi.mocked(updateDocumentMaster).mockResolvedValue(saved);
  const { result } = renderHook(() => useSaveDocumentMaster('master'), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  await act(async () => {
    await result.current.mutateAsync({ name: 'Contract', revision: 3 });
  });

  expect(client.getQueryData(['document-masters', 'master'])).toMatchObject({
    revision: 4,
    sourceUrl: '/original.pdf',
  });
  expect(client.getQueryState(draftKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(templateKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(otherKey)?.isInvalidated).toBe(false);
  expect(client.getQueryState(signedKey)?.isInvalidated).toBe(false);
  expect(client.getQueryData(draftKey)).toEqual({ masterId: 'master', values });
  client.clear();
});
