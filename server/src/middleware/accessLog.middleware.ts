import { isSentryEnabled } from "@/instrument";
import { logger } from "@/observability/logger";
import { metricRoute } from "@/observability/metricRoute";
import { getRequestContext } from "@/observability/requestContext";
import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";

const QUIET_PATHS = new Set(["/", "/healthz", "/health"]);

function shouldQuietAccessLog(req: Request): boolean {
    return req.method === "GET" && QUIET_PATHS.has(req.path);
}

/** One structured access log per finished request (health/root are debug-level). */
export function accessLogMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const startedAt = Date.now();

    res.on("finish", () => {
        const context = getRequestContext();
        const durationMs = Date.now() - startedAt;
        const fields = {
            event: "http.access",
            outcome: res.statusCode >= 500 ? "error" : "ok",
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs,
            requestId: req.requestId ?? context?.requestId,
            ...(context?.traceId ? { traceId: context.traceId } : {}),
        };

        if (isSentryEnabled && !shouldQuietAccessLog(req)) {
            Sentry.metrics.distribution("http.server.duration", durationMs, {
                unit: "millisecond",
                attributes: {
                    method: req.method,
                    route: metricRoute(req.path),
                    status_class: `${Math.floor(res.statusCode / 100)}xx`,
                },
            });
            if (res.statusCode >= 500) {
                Sentry.metrics.count("http.server.5xx", 1, {
                    attributes: {
                        method: req.method,
                        route: metricRoute(req.path),
                    },
                });
            }
        }

        if (shouldQuietAccessLog(req) && res.statusCode < 400) {
            logger.debug("HTTP access", fields);
            return;
        }

        if (res.statusCode >= 500) {
            logger.error("HTTP access", fields);
            return;
        }
        if (res.statusCode >= 400) {
            logger.warn("HTTP access", fields);
            return;
        }
        logger.info("HTTP access", fields);
    });

    next();
}
