export type CronErrorFields = {
    name: string;
    message: string;
    stack?: string;
};

export type CronLogFields = Record<string, unknown>;

export function serializeCronError(error: unknown): CronErrorFields {
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

/** Structured cron log: first arg is the job name for Render/log search. */
export function cronLog(
    level: "info" | "warn" | "error",
    job: string,
    fields: CronLogFields,
) {
    const payload = { job, ...fields };
    if (level === "error") {
        console.error(job, payload);
        return;
    }
    if (level === "warn") {
        console.warn(job, payload);
        return;
    }
    console.info(job, payload);
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
