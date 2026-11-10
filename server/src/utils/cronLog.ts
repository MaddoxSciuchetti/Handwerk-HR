import { logger, serializeError as serializeSharedError } from "@/observability/logger";

export type CronErrorFields = {
    name: string;
    message: string;
    stack?: string;
};

export type CronLogFields = Record<string, unknown>;

export function serializeCronError(error: unknown): CronErrorFields {
    return serializeSharedError(error);
}

/** Structured cron log: message starts with job name for Render/log search. */
export function cronLog(
    level: "info" | "warn" | "error",
    job: string,
    fields: CronLogFields,
) {
    const payload = { job, ...fields };
    if (level === "error") {
        logger.error(job, payload);
        return;
    }
    if (level === "warn") {
        logger.warn(job, payload);
        return;
    }
    logger.info(job, payload);
}

export function cronInfo(job: string, fields: CronLogFields) {
    cronLog("info", job, fields);
}

export function cronWarn(job: string, fields: CronLogFields) {
    cronLog("warn", job, fields);
}

export function cronError(job: string, fields: CronLogFields) {
    cronLog("error", job, fields);
}
