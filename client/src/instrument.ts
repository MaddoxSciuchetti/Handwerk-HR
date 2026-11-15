import * as Sentry from '@sentry/react';
import { router } from './router';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const isDev = import.meta.env.DEV;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration(),
    ],
    // Local: capture every trace so verification is easy. Production: 10%.
    tracesSampleRate: isDev ? 1.0 : 0.1,
    // Propagate trace headers to same-origin and the configured API host.
    tracePropagationTargets: [
      /^\//,
      /^https?:\/\/localhost(:\d+)?/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?/,
    ],
    replaysSessionSampleRate: isDev ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
