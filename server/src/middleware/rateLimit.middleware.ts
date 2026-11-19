import { nodeEnv } from "@/constants/env";
import { TOO_MANY_REQUESTS } from "@/constants/http";
import type { Request, RequestHandler } from "express";
import rateLimit, { type Options } from "express-rate-limit";

const RATE_LIMIT_MESSAGE = {
    message: "Too many requests, please try again later",
};

function isTestEnv(): boolean {
    return nodeEnv() === "test";
}

/** Off in Jest unless RATE_LIMIT_IN_TEST=1 (so unit suites stay quiet). */
function shouldBypassRateLimit(): boolean {
    return isTestEnv() && process.env.RATE_LIMIT_IN_TEST !== "1";
}

/** Paths that must not be blocked by the global limiter (uptime, webhooks, crons). */
export function shouldSkipGlobalRateLimit(req: Request): boolean {
    if (
        req.method === "GET" &&
        (req.path === "/" || req.path === "/health" || req.path === "/healthz")
    ) {
        return true;
    }
    if (req.path.startsWith("/webhooks/")) {
        return true;
    }
    if (req.path.startsWith("/internal/cron/")) {
        return true;
    }
    return false;
}

type LimiterOptions = Pick<Options, "windowMs" | "max"> &
    Partial<Pick<Options, "skip" | "message">>;

export function createRateLimiter(options: LimiterOptions): RequestHandler {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        statusCode: TOO_MANY_REQUESTS,
        message: options.message ?? RATE_LIMIT_MESSAGE,
        skip: (req, res) => {
            if (shouldBypassRateLimit()) return true;
            if (options.skip) return Boolean(options.skip(req, res));
            return false;
        },
    });
}

/** Soft ceiling for the whole API (per IP). */
export const globalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    skip: (req) => shouldSkipGlobalRateLimit(req),
});

/** Stricter limit for /auth (login, register, password reset, refresh). */
export const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        message: "Too many auth attempts, please try again later",
    },
});
