import { logger, rootLogger, serializeError } from "./logger";
import { shutdownTracing } from "./tracing";

let registered = false;

async function flushObservability(signal: string): Promise<void> {
    logger.info("Shutting down observability", {
        event: "observability.shutdown",
        outcome: "started",
        signal,
    });
    try {
        await shutdownTracing();
        await new Promise<void>((resolve, reject) => {
            rootLogger.flush((err) => (err ? reject(err) : resolve()));
        });
        logger.info("Observability flush complete", {
            event: "observability.shutdown",
            outcome: "ok",
            signal,
        });
    } catch (error) {
        // Last-resort stderr if logger flush already failed.
        console.error("Observability shutdown failed", serializeError(error));
    }
}

/** Flush traces/logs on Render deploy signals. Safe to call once. */
export function registerObservabilityShutdown(): void {
    if (registered || process.env.NODE_ENV === "test") return;
    registered = true;

    const onSignal = (signal: NodeJS.Signals) => {
        void flushObservability(signal).finally(() => {
            process.exit(0);
        });
    };

    process.once("SIGTERM", () => onSignal("SIGTERM"));
    process.once("SIGINT", () => onSignal("SIGINT"));
}

export function registerProcessErrorHandlers(): void {
    if (process.env.NODE_ENV === "test") return;

    process.on("unhandledRejection", (reason) => {
        logger.error("Unhandled promise rejection", {
            event: "process.unhandled_rejection",
            outcome: "error",
            error: serializeError(reason),
        });
    });

    process.on("uncaughtException", (error) => {
        logger.error("Uncaught exception", {
            event: "process.uncaught_exception",
            outcome: "error",
            error: serializeError(error),
        });
        void flushObservability("uncaughtException").finally(() => {
            process.exit(1);
        });
    });
}
