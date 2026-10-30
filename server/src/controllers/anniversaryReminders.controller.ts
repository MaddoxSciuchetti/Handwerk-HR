import catchErrors from "@/utils/catchErrors";
import { runAnniversaryReminders } from "@/services/anniversaryReminders";

export const postAnniversaryReminders = catchErrors(async (_req, res) => {
    const data = await runAnniversaryReminders();
    res.status(data.failed ? 503 : 200).json(data);
});
