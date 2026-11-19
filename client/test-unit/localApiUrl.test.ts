import { alignHostedApiUrl, alignLocalApiUrl } from '@/config/env';
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

it('preserves an explicitly configured API URL', () => {
  expect(alignLocalApiUrl('https://api.example.com', '127.0.0.1')).toBe(
    'https://api.example.com'
  );
});

it('rewrites a local API host to the page host', () => {
  expect(alignLocalApiUrl('http://localhost:3000', '127.0.0.1')).toBe(
    'http://127.0.0.1:3000'
  );
});

it('forces same-origin /api when frontend and API are different onrender hosts', () => {
  expect(
    alignHostedApiUrl(
      'https://bsb-onboarding-backend-staging.onrender.com',
      'bsb-onboarding-frontend-staging.onrender.com'
    )
  ).toBe('/api');
});

it('keeps an absolute onrender API URL when the page is already that host', () => {
  expect(
    alignHostedApiUrl(
      'https://bsb-onboarding-backend-staging.onrender.com',
      'bsb-onboarding-backend-staging.onrender.com'
    )
  ).toBe('https://bsb-onboarding-backend-staging.onrender.com');
});

it('leaves relative /api unchanged on onrender pages', () => {
  expect(
    alignHostedApiUrl('/api', 'bsb-onboarding-frontend-staging.onrender.com')
  ).toBe('/api');
});

it('uses /api at runtime when a staged onrender page was built with an absolute API URL', async () => {
  vi.resetModules();
  vi.stubEnv(
    'VITE_API_URL',
    'https://bsb-onboarding-backend-staging.onrender.com'
  );
  vi.stubGlobal('window', {
    location: { hostname: 'bsb-onboarding-frontend-staging.onrender.com' },
  });
  const { API_URL } = await import('@/config/env');
  expect(API_URL).toBe('/api');
});
