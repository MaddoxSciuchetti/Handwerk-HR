import { isSentryEnabled } from "@/instrument";
import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";

/** Attach requestId (and later user) so Sentry Performance/Issues group by the same id as logs. */
export function sentryContextMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
): void {
    if (!isSentryEnabled) {
        next();
        return;
    }

    const scope = Sentry.getCurrentScope();
    if (req.requestId) {
        scope.setTag("request_id", req.requestId);
    }
    next();
}
