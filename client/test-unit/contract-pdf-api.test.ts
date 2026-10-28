import { afterEach, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import API from '@/config/apiClient';
import { prepareEmploymentContractDownload } from '@/features/worker-task-management/api/employmentContract.api';

const originalAdapter = API.defaults.adapter;
afterEach(() => {
  API.defaults.adapter = originalAdapter;
});

it('receives the PDF bytes and preparation metadata in a single response', async () => {
  const blob = new Blob(['%PDF'], { type: 'application/pdf' });
  const prepared = {
    id: 'pdf-1',
    previewUrl: 'https://example.test/pdf?signature=a%2Fb',
    contentHash: 'hash',
    masterRevision: 2,
  };
  API.defaults.adapter = vi.fn(async (config) => ({
    config,
    status: 200,
    statusText: 'OK',
    data: blob,
    headers: new AxiosHeaders({
      'x-prepared-pdf': encodeURIComponent(JSON.stringify(prepared)),
    }),
  }));
  const result = await prepareEmploymentContractDownload(
    'worker',
    'engagement',
    { name: 'Ada' }
  );
  expect(result.blob).toBe(blob);
  expect(result.prepared).toEqual(prepared);
  expect(API.defaults.adapter).toHaveBeenCalledTimes(1);
});

it('preserves JSON error messages returned as blobs', async () => {
  API.defaults.adapter = async (config) => {
    throw new AxiosError('Conflict', 'ERR_BAD_REQUEST', config, undefined, {
      config,
      status: 409,
      statusText: 'Conflict',
      headers: new AxiosHeaders(),
      data: new Blob(
        [JSON.stringify({ message: 'Die Vorlage wurde geändert.' })],
        { type: 'application/json' }
      ),
    });
  };
  await expect(
    prepareEmploymentContractDownload('worker', 'engagement', {})
  ).rejects.toEqual({ status: 409, message: 'Die Vorlage wurde geändert.' });
});
