import * as Sentry from '@sentry/react';
import {
  APP_MODE,
  IS_DEV,
  VITE_SENTRY_DSN,
} from '@/config/env';
import { router } from './router';

if (VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: VITE_SENTRY_DSN,
    environment: APP_MODE,
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration(),
    ],
    // Local: capture every trace so verification is easy. Production: 10%.
    tracesSampleRate: IS_DEV ? 1.0 : 0.1,
    // Propagate trace headers to same-origin and the configured API host.
    tracePropagationTargets: [
      /^\//,
      /^https?:\/\/localhost(:\d+)?/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?/,
    ],
    replaysSessionSampleRate: IS_DEV ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
