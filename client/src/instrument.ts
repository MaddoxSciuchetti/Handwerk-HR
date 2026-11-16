import * as Sentry from '@sentry/react';
import { appMode, isDev, viteSentryDsn } from '@/config/env';
import { router } from './router';

const dsn = viteSentryDsn();

if (dsn) {
  Sentry.init({
    dsn,
    environment: appMode(),
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration(),
    ],
    // Local: capture every trace so verification is easy. Production: 10%.
    tracesSampleRate: isDev() ? 1.0 : 0.1,
    // Propagate trace headers to same-origin and the configured API host.
    tracePropagationTargets: [
      /^\//,
      /^https?:\/\/localhost(:\d+)?/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?/,
    ],
    replaysSessionSampleRate: isDev() ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
