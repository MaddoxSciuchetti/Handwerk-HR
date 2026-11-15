import "dotenv/config";
// OpenTelemetry must register before Express is imported.
import { startTracing } from "./observability/tracing";
import {
    registerObservabilityShutdown,
    registerProcessErrorHandlers,
} from "./observability/shutdown";

startTracing();
registerProcessErrorHandlers();
registerObservabilityShutdown();

import "./server";
