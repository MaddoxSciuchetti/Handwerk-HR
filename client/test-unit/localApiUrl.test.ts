import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(['127.0.0.1', 'localhost'])(
  'keeps session requests on the same local hostname: %s',
  async (hostname) => {
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', undefined);
    vi.stubGlobal('window', { location: { hostname } });
    const { API_URL } = await import('@/config/env');
    expect(API_URL).toBe(`http://${hostname}:3000`);
  }
);

it('preserves an explicitly configured API URL', async () => {
  vi.resetModules();
  vi.stubEnv('VITE_API_URL', 'https://api.example.com');
  vi.stubGlobal('window', { location: { hostname: '127.0.0.1' } });
  const { API_URL } = await import('@/config/env');
  expect(API_URL).toBe('https://api.example.com');
});
