import { BAD_REQUEST } from "@/constants/http";
import { microsoft365AutomationStatus } from "@/services/microsoft365Account";
import {
    saveWelcomeMailSettings,
    welcomeMailPage,
    type WelcomeMailSettingsRecord,
} from "@/services/welcomeMail";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";
import { z } from "zod";

const welcomeMailInput = z.object({
    senderAddress: z.string().trim().email().max(254),
    groupId: z.string().trim().min(1).max(255),
    groupName: z.string().trim().min(1).max(255),
    subject: z.string().trim().min(1).max(400),
    body: z.string().trim().min(1).max(20_000),
}) satisfies z.ZodType<WelcomeMailSettingsRecord>;

export const getMicrosoft365Automation = catchErrors(async (_req, res) => {
    return res.status(200).json({
        success: true,
        data: microsoft365AutomationStatus(),
    });
});

export const getWelcomeMail = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    return res.status(200).json({
        success: true,
        data: await welcomeMailPage(req.orgId),
    });
});

export const putWelcomeMail = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = welcomeMailInput.parse(req.body);
    return res.status(200).json({
        success: true,
        data: await saveWelcomeMailSettings(req.orgId, input),
    });
});
