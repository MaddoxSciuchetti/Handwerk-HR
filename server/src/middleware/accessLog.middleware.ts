import { logger } from "@/observability/logger";
import { getRequestContext } from "@/observability/requestContext";
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
        const fields = {
            event: "http.access",
            outcome: res.statusCode >= 500 ? "error" : "ok",
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            requestId: req.requestId ?? context?.requestId,
            ...(context?.traceId ? { traceId: context.traceId } : {}),
        };

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
