import { prisma } from "@/lib/prisma";
import { microsoftSimulationEnabled } from "@/constants/env";
import { createCrewmeisterAccount } from "@/services/integrations/crewmeisterAccount";
import {
    integrationsLive,
    loadCrewmeisterToken,
    loadMicrosoft365Config,
    NOT_LIVE_MESSAGE,
} from "@/services/integrations/runtime";
import { provisionMicrosoft365Account, microsoftGraphToken } from "@/services/microsoft365Account";
import { isMailSequence, sendIssueMail } from "@/services/engagementMail";
import { blockMicrosoftSignIn } from "@/services/offboardingAutomation";
import type { IntegrationSequence } from "@prisma/client";

export type SequenceRunResult =
    | { status: "completed" }
    | { status: "failed"; message: string };

async function markDone(params: {
    issueId: string;
    previousStatus: string;
    actorUserId: string;
}) {
    if (params.previousStatus === "done") return;
    await prisma.$transaction(async (tx) => {
        await tx.issue.update({
            where: { id: params.issueId },
            data: { status: "done" },
        });
        await tx.issueAuditLog.create({
            data: {
                issueId: params.issueId,
                actorUserId: params.actorUserId,
                action: "issue.updated",
                oldValue: { status: params.previousStatus },
                newValue: { status: "done" },
            },
        });
    });
}

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

async function finish(
    params: {
        issueId: string;
        previousStatus: string;
        actorUserId: string;
    },
    result: { status: string; reason?: string; message?: string },
): Promise<SequenceRunResult> {
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
        return { status: "failed", message: skippedMessage(result.reason ?? "") };
    }
    if (result.status === "already_sent" || result.status === "sent" || result.status === "created" || result.status === "completed" || result.status === "skipped") {
        await markDone(params);
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
    },
): Promise<SequenceRunResult> {
    const config = await loadMicrosoft365Config(params.organizationId);
    if (sequence === "microsoft_create_account") {
        return finish(params, await provisionMicrosoft365Account({
            organizationId: params.organizationId,
            workerId: params.workerId,
            config,
        }));
    }
    if (!config || (!integrationsLive() && !microsoftSimulationEnabled())) {
        return {
            status: "failed",
            message: !integrationsLive() && !microsoftSimulationEnabled()
                ? NOT_LIVE_MESSAGE
                : "Microsoft 365 ist für diese Organisation nicht eingerichtet.",
        };
    }
    if (isMailSequence(sequence)) {
        const mailed = await sendIssueMail({
            organizationId: params.organizationId,
            issueId: params.issueId,
            senderAddress: params.senderAddress,
        });
        if (mailed.status === "failed") return mailed;
        await markDone(params);
        return { status: "completed" };
    }
    if (sequence !== "microsoft_deactivate_account") {
        return { status: "failed", message: "Diese Sequenz gibt es nicht." };
    }
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: {
            id: true,
            workEmail: true,
            externalAccounts: {
                where: { provider: "microsoft_365" },
                select: { externalId: true },
                take: 1,
            },
        },
    });
    const userKey =
        worker?.externalAccounts[0]?.externalId.trim() ||
        worker?.workEmail?.trim() ||
        "";
    if (!userKey) {
        return {
            status: "failed",
            message: "Für diesen Mitarbeiter ist kein Microsoft-365-Konto hinterlegt.",
        };
    }
    const token = await microsoftGraphToken(config);
    if (!token) {
        return {
            status: "failed",
            message: "Microsoft Graph hat die Anmeldung abgelehnt.",
        };
    }
    const blocked = await blockMicrosoftSignIn(token, userKey);
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
    await markDone(params);
    return { status: "completed" };
}

export async function runIssueSequence(params: {
    organizationId: string;
    issueId: string;
    actorUserId: string;
    senderAddress?: string | null;
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
        senderAddress: params.senderAddress,
    };

    if (issue.integrationProvider === "crewmeister") {
        if (issue.sequence !== "crewmeister_create_account") {
            return { status: "failed", message: "Diese Sequenz gibt es nicht." };
        }
        const auth = await loadCrewmeisterToken(params.organizationId);
        return finish(
            context,
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
