import { isSentryEnabled } from "@/instrument";
import * as Sentry from "@sentry/node";

export type CronSentryMonitorOptions = {
    /** Sentry Crons monitor slug (also used in the Sentry UI). */
    monitorSlug: string;
    /** Crontab in the monitor timezone (UTC for our Render jobs). */
    schedule: string;
    /** Minutes allowed before Sentry marks the run as timed out. */
    maxRuntimeMinutes?: number;
    /** Minutes of slack before Sentry marks a run as missed. */
    checkinMarginMinutes?: number;
    timezone?: string;
};

/**
 * Tell Sentry Crons that a scheduled job started and finished.
 * No-op when SENTRY_DSN is unset so local/tests stay quiet.
 */
export async function withCronSentryCheckIn<T>(
    options: CronSentryMonitorOptions,
    run: () => Promise<T>,
    isOk: (result: T) => boolean = () => true,
): Promise<T> {
    if (!isSentryEnabled) {
        return run();
    }

    const monitorConfig = {
        schedule: {
            type: "crontab" as const,
            value: options.schedule,
        },
        maxRuntime: options.maxRuntimeMinutes ?? 10,
        checkinMargin: options.checkinMarginMinutes ?? 5,
        timezone: options.timezone ?? "UTC",
    };

    const checkInId = Sentry.captureCheckIn(
        {
            monitorSlug: options.monitorSlug,
            status: "in_progress",
        },
        monitorConfig,
    );

    try {
        const result = await run();
        Sentry.captureCheckIn({
            checkInId,
            monitorSlug: options.monitorSlug,
            status: isOk(result) ? "ok" : "error",
        });
        return result;
    } catch (error) {
        Sentry.captureCheckIn({
            checkInId,
            monitorSlug: options.monitorSlug,
            status: "error",
        });
        throw error;
    }
}
