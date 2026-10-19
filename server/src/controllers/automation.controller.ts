import { BAD_REQUEST } from "@/constants/http";
import { isTaskAutomationId } from "@/constants/taskAutomation.consts";
import {
    automationDocumentPage,
    isDocumentAutomation,
    saveAutomationDocument,
} from "@/services/automationDocument";
import { microsoft365AutomationStatus } from "@/services/microsoft365Account";
import {
    engagementMailOptions,
    listBsbMailAddresses,
    mailSendPreview,
    readEngagementMailRecipients,
    saveEngagementMailRecipients,
} from "@/services/engagementMail";
import { runIssueSequence } from "@/services/integrations/runSequence";
import {
    listOrganizationIntegrations,
    redactIntegrationSecrets,
    saveOrganizationIntegration,
} from "@/services/integrations/store";
import { assertOrgAdmin } from "@/utils/assertOrgOwner";
import {
    saveDepartureMailSettings,
    departureMailPage,
} from "@/services/departureMail";
import {
    runTaskAutomation,
    arbeitszeugnisPreview,
    confirmArbeitszeugnis,
    prepareLetterForIssue,
} from "@/services/offboardingAutomation";
import {
    saveWelcomeMailSettings,
    welcomeMailPage,
    type WelcomeMailSettingsRecord,
} from "@/services/welcomeMail";
import { builtinCatalog } from "@/services/questionnaireDefinition";
import {
    employmentContractFields,
    questionnaireForOrganization,
    saveOrganizationQuestionnaire,
} from "@/services/questionnaireTemplate";
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

export const getMicrosoft365Automation = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    return res.status(200).json({
        success: true,
        data: await microsoft365AutomationStatus(req.orgId),
    });
});

const integrationInput = z.object({
    enabled: z.boolean(),
    tenantId: z.string().trim().max(255).optional(),
    clientId: z.string().trim().max(255).optional(),
    domain: z.string().trim().max(255).optional(),
    licenseSkuId: z.string().trim().max(255).optional(),
    crewId: z.string().trim().max(64).optional(),
    clientSecret: z.string().max(2000).optional(),
    token: z.string().max(8000).optional(),
});

export const getIntegrations = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const integrations = await listOrganizationIntegrations(req.orgId);
    return res.status(200).json({
        success: true,
        data:
            req.membershipRole === "admin"
                ? integrations
                : integrations.map(redactIntegrationSecrets),
    });
});

export const putIntegration = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    assertOrgAdmin(req.membershipRole);
    const provider = z
        .enum(["microsoft_graph", "crewmeister"])
        .parse(req.params.provider);
    const body = integrationInput.parse(req.body);
    return res.status(200).json({
        success: true,
        data: await saveOrganizationIntegration({
            organizationId: req.orgId,
            provider,
            ...body,
        }),
    });
});

const senderAddressInput = z.string().trim().email().max(254);

export const postIssueSequence = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    appAssert(req.userId, BAD_REQUEST, "Benutzer fehlt.");
    const senderAddress =
        req.body?.senderAddress == null
            ? undefined
            : senderAddressInput.parse(req.body.senderAddress);
    const result = await runIssueSequence({
        organizationId: req.orgId,
        issueId: String(req.params.issueId),
        actorUserId: req.userId,
        senderAddress,
    });
    appAssert(
        result.status === "completed",
        BAD_REQUEST,
        result.status === "failed"
            ? result.message
            : "Sequenz fehlgeschlagen.",
    );
    return res.status(200).json({ success: true, data: result });
});

export const getMicrosoftMailAddresses = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    return res.status(200).json({
        success: true,
        data: await listBsbMailAddresses(req.orgId),
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
    appAssert(
        result.status === "ready",
        BAD_REQUEST,
        result.status === "failed"
            ? result.message
            : "Arbeitszeugnis konnte nicht geladen werden.",
    );
    return res.status(200).json({ success: true, data: result.preview });
});

export const postArbeitszeugnis = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    appAssert(req.userId, BAD_REQUEST, "Benutzer fehlt.");
    const artifactId = z.string().parse(req.body?.artifactId);
    const result = await confirmArbeitszeugnis({
        organizationId: req.orgId,
        issueId: String(req.params.issueId),
        actorUserId: req.userId,
        artifactId,
    });
    appAssert(
        result.status === "completed",
        BAD_REQUEST,
        result.status === "failed"
            ? result.message
            : "Automatisierung fehlgeschlagen.",
    );
    return res.status(200).json({ success: true, data: result });
});

export const prepareArbeitszeugnis = catchErrors(async (req, res) => {
    const values = z
        .record(z.string(), z.string().max(8000))
        .parse(req.body?.values);
    const result = await prepareLetterForIssue({
        organizationId: req.orgId,
        issueId: String(req.params.issueId),
        values,
    });
    appAssert(
        result.status === "prepared",
        BAD_REQUEST,
        "PDF konnte nicht vorbereitet werden.",
    );
    return res.json({ success: true, data: result.data });
});
export const saveArbeitszeugnisValues = catchErrors(async (req, res) => {
    const values = z
        .record(z.string(), z.string().max(8000))
        .parse(req.body?.values);
    const result = await prepareLetterForIssue(
        {
            organizationId: req.orgId,
            issueId: String(req.params.issueId),
            values,
        },
        true,
    );
    appAssert(
        result.status === "saved",
        BAD_REQUEST,
        "Entwurf konnte nicht gespeichert werden.",
    );
    return res.json({ success: true });
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
    const senderAddress =
        req.body?.senderAddress == null
            ? undefined
            : senderAddressInput.parse(req.body.senderAddress);
    const result = await runTaskAutomation({
        organizationId: req.orgId,
        issueId: String(req.params.issueId),
        actorUserId: req.userId,
        automation,
        senderAddress,
    });
    appAssert(
        result.status === "completed",
        BAD_REQUEST,
        result.status === "failed"
            ? result.message
            : "Automatisierung fehlgeschlagen.",
    );
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
    const documentMasterId = z
        .string()
        .uuid()
        .parse(req.body?.documentMasterId);
    return res.status(200).json({
        success: true,
        data: await saveAutomationDocument({
            organizationId: req.orgId,
            automation,
            documentMasterId,
        }),
    });
});

export const getQuestionnaireTemplate = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const [definition, contractFields] = await Promise.all([
        questionnaireForOrganization(req.orgId),
        employmentContractFields(req.orgId),
    ]);
    return res.status(200).json({
        success: true,
        data: { ...definition, catalog: builtinCatalog(), contractFields },
    });
});

export const putQuestionnaireTemplate = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const definition = await saveOrganizationQuestionnaire(req.orgId, req.body);
    return res.status(200).json({ success: true, data: definition });
});

export const putDepartureMail = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = teamMailInput.parse(req.body);
    return res.status(200).json({
        success: true,
        data: await saveDepartureMailSettings(req.orgId, input),
    });
});

export const getIssueMailPreview = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const preview = await mailSendPreview({
        organizationId: req.orgId,
        issueId: String(req.params.issueId),
    });
    const previewError =
        preview.status === "failed"
            ? preview.message
            : "Die E-Mail konnte nicht geladen werden.";
    appAssert(preview.status === "ready", BAD_REQUEST, previewError);
    return res.status(200).json({ success: true, data: preview });
});

const mailRecipientInput = z.object({
    recipients: z
        .array(
            z.object({
                kind: z.enum([
                    "worker_private",
                    "worker_work",
                    "microsoft_group",
                    "teams_channel",
                    "microsoft_user",
                ]),
                label: z.string().trim().max(255),
                address: z.string().trim().max(254).nullable().optional(),
                workerId: z.string().trim().max(64).nullable().optional(),
                groupId: z.string().trim().max(255).nullable().optional(),
                microsoftUserId: z.string().trim().max(64).nullable().optional(),
            }),
        )
        .max(50),
});

export const getEngagementMailRecipients = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const engagementId = String(req.params.engagementId);
    const selected = await readEngagementMailRecipients(req.orgId, engagementId);
    appAssert(selected, BAD_REQUEST, "Engagement nicht gefunden.");
    const options = await engagementMailOptions(req.orgId);
    return res.status(200).json({
        success: true,
        data: { selected, ...options },
    });
});

export const putEngagementMailRecipients = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = mailRecipientInput.parse(req.body);
    const selected = await saveEngagementMailRecipients({
        organizationId: req.orgId,
        engagementId: String(req.params.engagementId),
        recipients: input.recipients,
    });
    appAssert(selected, BAD_REQUEST, "Engagement nicht gefunden.");
    return res.status(200).json({ success: true, data: selected });
});
