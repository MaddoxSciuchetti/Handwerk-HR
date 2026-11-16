import * as Sentry from "@sentry/node";
import { NODE_ENV, SENTRY_DSN } from "@/constants/env";

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: NODE_ENV,
        // Local: capture every trace for verification. Production: 10%.
<<<<<<< HEAD
        tracesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,
=======
        // These transactions power Sentry Performance + span/metric monitors
        // (Alerts → create monitor on p95 duration or failure rate).
        tracesSampleRate: isProd ? 0.1 : 1.0,
>>>>>>> origin/main
    });
}

export const isSentryEnabled = Boolean(SENTRY_DSN);
