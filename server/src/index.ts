import "dotenv/config";
// Sentry must initialize before the rest of the app (and before Express).
import { isSentryEnabled } from "./instrument";
// OpenTelemetry must register before Express is imported when Sentry is off.
import { startTracing } from "./observability/tracing";
import {
    registerObservabilityShutdown,
    registerProcessErrorHandlers,
} from "./observability/shutdown";

// Avoid dual OpenTelemetry SDKs when Sentry owns tracing.
if (!isSentryEnabled) {
    startTracing();
}
registerProcessErrorHandlers();
registerObservabilityShutdown();

import "./server";
