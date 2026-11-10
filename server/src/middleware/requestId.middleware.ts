import { bindRequestContext } from "@/observability/requestContext";
import { context, trace } from "@opentelemetry/api";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

const REQUEST_ID_HEADER = "x-request-id";

function readIncomingRequestId(req: Request): string | undefined {
    const header = req.headers[REQUEST_ID_HEADER];
    if (typeof header === "string" && header.trim()) {
        return header.trim();
    }
    if (Array.isArray(header) && header[0]?.trim()) {
        return header[0].trim();
    }
    return undefined;
}

/** Assigns/echoes X-Request-Id and opens async request context for correlation. */
export function requestIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const requestId = readIncomingRequestId(req) ?? randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    const activeSpan = trace.getSpan(context.active());
    const spanContext = activeSpan?.spanContext();

    bindRequestContext({
        requestId,
        ...(spanContext?.traceId ? { traceId: spanContext.traceId } : {}),
        ...(spanContext?.spanId ? { spanId: spanContext.spanId } : {}),
    });

    if (activeSpan) {
        activeSpan.setAttribute("http.request_id", requestId);
    }

    next();
}
