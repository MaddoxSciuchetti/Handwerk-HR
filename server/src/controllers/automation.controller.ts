import { microsoft365AutomationStatus } from "@/services/microsoft365Account";
import catchErrors from "@/utils/catchErrors";

export const getMicrosoft365Automation = catchErrors(async (_req, res) => {
    return res.status(200).json({
        success: true,
        data: microsoft365AutomationStatus(),
    });
});
