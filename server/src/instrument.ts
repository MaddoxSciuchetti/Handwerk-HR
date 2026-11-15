import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN?.trim();
const isProd = process.env.NODE_ENV === "production";

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV ?? "development",
        // Local: capture every trace for verification. Production: 10%.
        tracesSampleRate: isProd ? 0.1 : 1.0,
    });
}

export const isSentryEnabled = Boolean(dsn);
