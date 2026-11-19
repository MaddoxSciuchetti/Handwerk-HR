import catchErrors from "@/utils/catchErrors";
import { runAnniversaryReminders } from "@/services/anniversaryReminders";
import { withCronSentryCheckIn } from "@/utils/withCronSentryCheckIn";

/** Matches production Render cron (`ops/anniversary-reminders.md`), UTC. */
const ANNIVERSARY_CRON_SCHEDULE = "0 6 * * *";

export const postAnniversaryReminders = catchErrors(async (_req, res) => {
    const data = await withCronSentryCheckIn(
        {
            monitorSlug: "anniversary-reminders",
            schedule: ANNIVERSARY_CRON_SCHEDULE,
            maxRuntimeMinutes: 10,
            checkinMarginMinutes: 30,
            timezone: "UTC",
        },
        () => runAnniversaryReminders(),
        (result) => result.failed === 0,
    );
    res.status(data.failed ? 503 : 200).json(data);
});
