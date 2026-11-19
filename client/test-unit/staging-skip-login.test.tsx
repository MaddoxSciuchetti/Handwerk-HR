import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('keeps STAGING_SKIP_LOGIN off by default', async () => {
  vi.stubEnv('VITE_STAGING_SKIP_LOGIN', undefined);
  const { STAGING_SKIP_LOGIN } = await import('@/config/env');
  expect(STAGING_SKIP_LOGIN).toBe(false);
});

it('enables STAGING_SKIP_LOGIN when the Vite flag is true', async () => {
  vi.stubEnv('VITE_STAGING_SKIP_LOGIN', 'true');
  const { STAGING_SKIP_LOGIN, STAGING_HOME_PATH } = await import('@/config/env');
  expect(STAGING_SKIP_LOGIN).toBe(true);
  expect(STAGING_HOME_PATH).toBe('/worker-lifycycle');
});
