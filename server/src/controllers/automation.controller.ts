import { BAD_REQUEST } from "@/constants/http";
import { isTaskAutomationId } from "@/constants/taskAutomation.consts";
import {
    automationDocumentPage,
    isDocumentAutomation,
    saveAutomationDocument,
} from "@/services/automationDocument";
import { microsoft365AutomationStatus } from "@/services/microsoft365Account";
import {
    saveDepartureMailSettings,
    departureMailPage,
} from "@/services/departureMail";
import { runTaskAutomation, arbeitszeugnisPreview, confirmArbeitszeugnis } from "@/services/offboardingAutomation";
import {
    saveWelcomeMailSettings,
    welcomeMailPage,
    type WelcomeMailSettingsRecord,
} from "@/services/welcomeMail";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";
import { z } from "zod";

const teamMailInput = z.object({
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

export const getArbeitszeugnisPreview = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const result = await arbeitszeugnisPreview({
        organizationId: req.orgId,
        issueId: String(req.params.issueId),
    });
    appAssert(result.status === "ready", BAD_REQUEST, result.status === "failed" ? result.message : "Arbeitszeugnis konnte nicht geladen werden.");
    return res.status(200).json({ success: true, data: result.preview });
});

export const postArbeitszeugnis = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    appAssert(req.userId, BAD_REQUEST, "Benutzer fehlt.");
    const values = z.record(z.string(), z.string().max(8000)).parse(req.body?.values ?? {});
    const result = await confirmArbeitszeugnis({
        organizationId: req.orgId,
        issueId: String(req.params.issueId),
        actorUserId: req.userId,
        values,
    });
    appAssert(
        result.status === "completed",
        BAD_REQUEST,
        result.status === "failed" ? result.message : "Automatisierung fehlgeschlagen.",
    );
    return res.status(200).json({ success: true, data: result });
});

export const postTaskAutomation = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    appAssert(req.userId, BAD_REQUEST, "Benutzer fehlt.");
    const automation =
        typeof req.body?.automation === "string" ? req.body.automation : "";
    appAssert(
        isTaskAutomationId(automation),
        BAD_REQUEST,
        "Bitte eine Automatisierung wählen.",
    );
    const result = await runTaskAutomation({
        organizationId: req.orgId,
        issueId: String(req.params.issueId),
        actorUserId: req.userId,
        automation,
    });
    appAssert(result.status === "completed", BAD_REQUEST, result.status === "failed" ? result.message : "Automatisierung fehlgeschlagen.");
    return res.status(200).json({ success: true, data: result });
});

export const getDepartureMail = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    return res.status(200).json({
        success: true,
        data: await departureMailPage(req.orgId),
    });
});

export const putWelcomeMail = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = teamMailInput.parse(req.body);
    return res.status(200).json({
        success: true,
        data: await saveWelcomeMailSettings(req.orgId, input),
    });
});

export const getAutomationDocument = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const automation = String(req.params.automation);
    appAssert(
        isDocumentAutomation(automation),
        BAD_REQUEST,
        "Diese Automatisierung verwendet kein Dokument.",
    );
    return res.status(200).json({
        success: true,
        data: await automationDocumentPage(req.orgId, automation),
    });
});

export const putAutomationDocument = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const automation = String(req.params.automation);
    appAssert(
        isDocumentAutomation(automation),
        BAD_REQUEST,
        "Diese Automatisierung verwendet kein Dokument.",
    );
    const documentMasterId = z.string().uuid().parse(req.body?.documentMasterId);
    return res.status(200).json({
        success: true,
        data: await saveAutomationDocument({
            organizationId: req.orgId,
            automation,
            documentMasterId,
        }),
    });
});

export const putDepartureMail = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = teamMailInput.parse(req.body);
    return res.status(200).json({
        success: true,
        data: await saveDepartureMailSettings(req.orgId, input),
    });
});
