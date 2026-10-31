import { isDeactivation, claimDeactivation, finishDeactivation } from "./deactivationSchedule";
import { executionStatus, executionError } from "./issueExecutionStatus";
import { prisma } from "@/lib/prisma";
import { microsoftSimulationEnabled } from "@/constants/env";
import {
    createCrewmeisterAccount,
    deactivateCrewmeisterAccount,
    deleteCrewmeisterMembership,
} from "@/services/integrations/crewmeisterAccount";
import {
    integrationsLive,
    loadCrewmeisterToken,
    loadMicrosoft365Config,
    NOT_LIVE_MESSAGE,
} from "@/services/integrations/runtime";
import {
    provisionMicrosoft365Account,
    microsoftGraphToken,
} from "@/services/microsoft365Account";
import { isMailSequence, sendIssueMail } from "@/services/engagementMail";
import { blockMicrosoftSignIn } from "@/services/offboardingAutomation";
import type { IntegrationSequence } from "@prisma/client";

export type SequenceRunResult =
    | { status: "completed" }
    | { status: "failed"; message: string };

function skippedMessage(reason: string) {
    if (reason === "not_live") return NOT_LIVE_MESSAGE;
    if (reason === "not_configured") {
        return "Die Integration ist für diese Organisation nicht eingerichtet.";
    }
    if (reason === "no_work_email") {
        return "Für diesen Mitarbeiter ist keine Arbeits-E-Mail hinterlegt.";
    }
    if (reason === "worker_missing") return "Mitarbeiter nicht gefunden.";
    return "Die Sequenz wurde nicht ausgeführt.";
}

function finish(result: {
    status: string;
    reason?: string;
    message?: string;
}): SequenceRunResult {
    if (result.status === "failed") {
        return {
            status: "failed",
            message: result.message || "Die Sequenz wurde abgelehnt.",
        };
    }
    if (
        result.status === "skipped" &&
        result.reason !== "already_provisioned" &&
        result.reason !== "already_created" &&
        result.reason !== "already_sent"
    ) {
        return {
            status: "failed",
            message: skippedMessage(result.reason ?? ""),
        };
    }
    if (
        result.status === "already_sent" ||
        result.status === "sent" ||
        result.status === "created" ||
        result.status === "completed" ||
        result.status === "skipped"
    ) {
        return { status: "completed" };
    }
    return { status: "failed", message: "Die Sequenz wurde nicht ausgeführt." };
}

async function runMicrosoft(
    sequence: IntegrationSequence,
    params: {
        organizationId: string;
        workerId: string;
        engagementId: string;
        actorUserId: string;
        issueId: string;
        previousStatus: string;
        senderAddress?: string | null;
        subject?: string | null;
        body?: string | null;
        microsoftAccountId?: string | null;
    },
): Promise<SequenceRunResult> {
    if (sequence === "microsoft_send_teams_message")
        return {
            status: "failed",
            message: "Bitte die Teams-Vorschau öffnen und Kanäle auswählen.",
        };
    const config = await loadMicrosoft365Config(params.organizationId);
    if (sequence === "microsoft_create_account") {
        const actor = await prisma.user.findUnique({
            where: { id: params.actorUserId },
            select: { email: true },
        });
        return finish(
            await provisionMicrosoft365Account({
                organizationId: params.organizationId,
                workerId: params.workerId,
                config,
                senderAddress: actor?.email,
            }),
        );
    }
    if (!config || (!integrationsLive() && !microsoftSimulationEnabled())) {
        return {
            status: "failed",
            message:
                !integrationsLive() && !microsoftSimulationEnabled()
                    ? NOT_LIVE_MESSAGE
                    : "Microsoft 365 ist für diese Organisation nicht eingerichtet.",
        };
    }
    if (isMailSequence(sequence)) {
        const mailed = await sendIssueMail({
            organizationId: params.organizationId,
            issueId: params.issueId,
            senderAddress: params.senderAddress,
            subject: params.subject,
            body: params.body,
        });
        if (mailed.status === "failed") return mailed;
        return { status: "completed" };
    }
    if (sequence !== "microsoft_deactivate_account") {
        return { status: "failed", message: "Diese Sequenz gibt es nicht." };
    }
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: {
            id: true,
            externalAccounts: {
                where: { provider: "microsoft_365" },
                select: { externalId: true },
                take: 1,
            },
        },
    });
    const userKey =
        params.microsoftAccountId?.trim() ||
        worker?.externalAccounts[0]?.externalId.trim() ||
        "";
    if (!userKey) {
        return {
            status: "failed",
            message:
                "Für diesen Mitarbeiter ist keine Microsoft-365-ID hinterlegt.",
        };
    }
    const token = await microsoftGraphToken(config);
    if (!token) {
        return {
            status: "failed",
            message: "Microsoft Graph hat die Anmeldung abgelehnt.",
        };
    }
    const blocked = await blockMicrosoftSignIn(
        token,
        userKey,
        config.licenseSkuId,
    );
    if (!blocked.ok) return { status: "failed", message: blocked.message };
    await prisma.workerExternalAccount.upsert({
        where: {
            workerId_provider: {
                workerId: params.workerId,
                provider: "microsoft_365",
            },
        },
        create: {
            workerId: params.workerId,
            provider: "microsoft_365",
            externalId: blocked.externalId,
            status: "disabled",
        },
        update: { externalId: blocked.externalId, status: "disabled" },
    });
    return { status: "completed" };
}

async function executeIssueSequence(params: {
    organizationId: string;
    issueId: string;
    actorUserId: string;
    senderAddress?: string | null;
    subject?: string | null;
    body?: string | null;
    scheduled?: boolean;
}): Promise<SequenceRunResult> {
    const issue = await prisma.issue.findFirst({
        where: {
            id: params.issueId,
            workerEngagement: { organizationId: params.organizationId },
        },
        select: {
            id: true,
            status: true,
            sequence: true,
            microsoftAccountId: true,
            integrationProvider: true,
            workerEngagement: {
                select: {
                    id: true,
                    workerId: true,
                },
            },
        },
    });
    if (!issue?.workerEngagement)
        return { status: "failed", message: "Aufgabe nicht gefunden." };
    if (!issue.sequence || !issue.integrationProvider) {
        return {
            status: "failed",
            message: "Für diese Aufgabe ist keine Sequenz hinterlegt.",
        };
    }

    const context = {
        organizationId: params.organizationId,
        workerId: issue.workerEngagement.workerId,
        engagementId: issue.workerEngagement.id,
        actorUserId: params.actorUserId,
        issueId: issue.id,
        previousStatus: issue.status,
        microsoftAccountId: issue.microsoftAccountId,
        senderAddress: params.senderAddress,
        subject: params.subject,
        body: params.body,
    };

    if (issue.integrationProvider === "crewmeister") {
        if (
            issue.sequence !== "crewmeister_create_account" &&
            issue.sequence !== "crewmeister_deactivate_account" &&
            issue.sequence !== "crewmeister_delete_membership"
        ) {
            return {
                status: "failed",
                message: "Diese Sequenz gibt es nicht.",
            };
        }
        const auth = await loadCrewmeisterToken(params.organizationId);
        if (issue.sequence === "crewmeister_delete_membership") {
            return finish(
                await deleteCrewmeisterMembership({
                    organizationId: params.organizationId,
                    workerId: context.workerId,
                    auth,
                }),
            );
        }
        if (issue.sequence === "crewmeister_deactivate_account") {
            return finish(
                await deactivateCrewmeisterAccount({
                    organizationId: params.organizationId,
                    workerId: context.workerId,
                    auth,
                }),
            );
        }
        return finish(
            await createCrewmeisterAccount({
                organizationId: params.organizationId,
                workerId: context.workerId,
                engagementId: context.engagementId,
                auth,
            }),
        );
    }

    return runMicrosoft(issue.sequence, context);
}

export async function runIssueSequence(
    params: Parameters<typeof executeIssueSequence>[0],
): Promise<SequenceRunResult> {
    const issue = await prisma.issue.findFirst({
        where: {
            id: params.issueId,
            workerEngagement: { organizationId: params.organizationId },
        },
        select: { id: true, status: true, sequence: true },
    });
    if (!issue) return { status: "failed", message: "Aufgabe nicht gefunden." };
    if (issue.status === "done") return { status: "completed" };
    if (isDeactivation(issue.sequence)) {
        const claim = await claimDeactivation(params);
        if (!claim) return { status: "failed", message: "Aufgabe ist nicht fällig oder wird bereits ausgeführt." };
        let result: SequenceRunResult;
        try {
            result = await executeIssueSequence({ ...params, actorUserId: claim.actorUserId });
        } catch (error) {
            result = { status: "failed", message: executionError(error) };
        }
        await finishDeactivation({
            issueId: issue.id, ...claim, scheduled: params.scheduled,
            succeeded: result.status === "completed",
            message: result.status === "failed" ? result.message : undefined,
        });
        return result;
    }
    await executionStatus(issue.id, params.actorUserId, "in_progress");
    let result: SequenceRunResult;
    try {
        result = await executeIssueSequence(params);
    } catch (error) {
        result = { status: "failed", message: executionError(error) };
    }
    await executionStatus(
        issue.id,
        params.actorUserId,
        result.status === "completed" ? "done" : "error",
        result.status === "failed" ? result.message : undefined,
    );
    return result;
}
