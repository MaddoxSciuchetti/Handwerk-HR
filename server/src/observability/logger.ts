import pino from "pino";
import { getRequestContext } from "./requestContext";
import { redactFields } from "./redact";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const level = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

export const rootLogger = pino({
    level: isTest ? "silent" : level,
    base: { service: "handwerk-hr-server" },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            "password",
            "passwd",
            "secret",
            "token",
            "authorization",
            "cookie",
            "accessToken",
            "refreshToken",
            "apiKey",
            "req.headers.authorization",
            "req.headers.cookie",
        ],
        censor: "[Redacted]",
    },
    transport:
        !isProduction && !isTest
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
});

export type LogFields = Record<string, unknown>;

function bindingsFromContext(): LogFields {
    const context = getRequestContext();
    if (!context) return {};
    return {
        requestId: context.requestId,
        ...(context.traceId ? { traceId: context.traceId } : {}),
        ...(context.spanId ? { spanId: context.spanId } : {}),
        ...(context.userId ? { userId: context.userId } : {}),
        ...(context.orgId ? { orgId: context.orgId } : {}),
    };
}

/** Logger that always merges request/trace correlation fields. */
export const logger = {
    info(message: string, fields: LogFields = {}) {
        rootLogger.info(
            { ...bindingsFromContext(), ...redactFields(fields) },
            message,
        );
    },
    warn(message: string, fields: LogFields = {}) {
        rootLogger.warn(
            { ...bindingsFromContext(), ...redactFields(fields) },
            message,
        );
    },
    error(message: string, fields: LogFields = {}) {
        rootLogger.error(
            { ...bindingsFromContext(), ...redactFields(fields) },
            message,
        );
    },
    debug(message: string, fields: LogFields = {}) {
        rootLogger.debug(
            { ...bindingsFromContext(), ...redactFields(fields) },
            message,
        );
    },
};

export function serializeError(error: unknown): {
    name: string;
    message: string;
    stack?: string;
} {
    if (error instanceof Error) {
        return {
            name: error.name || "Error",
            message: error.message || "Unknown error",
            ...(error.stack ? { stack: error.stack } : {}),
        };
    }
    if (error && typeof error === "object" && "message" in error) {
        const message = String((error as { message: unknown }).message);
        const name =
            "name" in error
                ? String((error as { name: unknown }).name || "Error")
                : "Error";
        return { name, message: message || "Unknown error" };
    }
    return { name: "Error", message: String(error) };
}
