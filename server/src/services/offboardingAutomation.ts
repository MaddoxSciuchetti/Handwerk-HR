import {
    ARBEITSZEUGNIS,
    O365_BLOCK_SIGN_IN,
    TEAM_DEPARTURE_MAIL,
    isTaskAutomationId,
} from "@/constants/taskAutomation.consts";
import { prisma } from "@/lib/prisma";
import {
    previewArbeitszeugnis,
    sendArbeitszeugnis,
    prepareArbeitszeugnisPdf,
    saveArbeitszeugnisDraft,
} from "@/services/arbeitszeugnis";
import { sendIssueMail } from "@/services/engagementMail";
import {
    integrationsLive,
    loadMicrosoft365Config,
    NOT_LIVE_MESSAGE,
} from "@/services/integrations/runtime";
import { microsoftGraphToken } from "@/services/microsoft365Account";

const GRAPH = "https://graph.microsoft.com/v1.0";

export type RunTaskAutomationResult =
    | { status: "completed"; alreadyBlocked: boolean }
    | { status: "failed"; message: string };

type GraphUser = {
    id?: string;
    accountEnabled?: boolean;
};

async function graphJson(token: string, path: string, init?: RequestInit) {
    const response = await fetch(`${GRAPH}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
    const text = await response.text();
    if (!text) return { response, payload: null };
    try {
        return { response, payload: JSON.parse(text) as unknown };
    } catch {
        return { response, payload: text };
    }
}

async function readMicrosoftUser(token: string, key: string) {
    const { response, payload } = await graphJson(
        token,
        `/users/${encodeURIComponent(key)}?$select=id,accountEnabled`,
    );
    if (response.status === 404) return { status: "missing" as const };
    if (!response.ok) {
        console.error("Microsoft Graph user read failed", response.status);
        return { status: "failed" as const };
    }
    const user = payload as GraphUser | null;
    const id = user?.id?.trim() ?? "";
    if (!id) return { status: "failed" as const };
    return {
        status: "found" as const,
        id,
        accountEnabled: user?.accountEnabled !== false,
    };
}

export async function blockMicrosoftSignIn(token: string, userKey: string) {
    const current = await readMicrosoftUser(token, userKey);
    if (current.status === "missing") {
        return {
            ok: false as const,
            message: "Das Microsoft-365-Konto wurde nicht gefunden.",
        };
    }
    if (current.status === "failed") {
        return {
            ok: false as const,
            message: "Microsoft Graph hat das Konto nicht geliefert.",
        };
    }
    if (!current.accountEnabled) {
        return {
            ok: true as const,
            externalId: current.id,
            alreadyBlocked: true,
        };
    }

    const patched = await graphJson(
        token,
        `/users/${encodeURIComponent(current.id)}`,
        {
            method: "PATCH",
            body: JSON.stringify({ accountEnabled: false }),
        },
    );
    if (!patched.response.ok) {
        console.error(
            "Microsoft Graph sign-in block failed",
            patched.response.status,
        );
        return {
            ok: false as const,
            message: "Microsoft Graph hat die Sperre abgelehnt.",
        };
    }

    const confirmed = await readMicrosoftUser(token, current.id);
    if (confirmed.status !== "found" || confirmed.accountEnabled) {
        return {
            ok: false as const,
            message: "Microsoft Graph hat die Sperre nicht bestätigt.",
        };
    }
    return {
        ok: true as const,
        externalId: confirmed.id,
        alreadyBlocked: false,
    };
}

async function markIssueDone(params: {
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

async function completeAutomatedTask(params: {
    issueId: string;
    previousStatus: string;
    actorUserId: string;
    workerId: string;
    externalId: string;
}) {
    await prisma.$transaction(async (tx) => {
        await tx.workerExternalAccount.upsert({
            where: {
                workerId_provider: {
                    workerId: params.workerId,
                    provider: "microsoft_365",
                },
            },
            create: {
                workerId: params.workerId,
                provider: "microsoft_365",
                externalId: params.externalId,
                status: "disabled",
            },
            update: {
                externalId: params.externalId,
                status: "disabled",
            },
        });
        if (params.previousStatus === "done") return;
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

export async function runTaskAutomation(params: {
    organizationId: string;
    issueId: string;
    actorUserId: string;
    automation: string;
    senderAddress?: string | null;
}): Promise<RunTaskAutomationResult> {
    if (!isTaskAutomationId(params.automation)) {
        return {
            status: "failed",
            message: "Diese Automatisierung gibt es nicht.",
        };
    }

    const issue = await prisma.issue.findFirst({
        where: {
            id: params.issueId,
            workerEngagement: { organizationId: params.organizationId },
        },
        select: {
            id: true,
            status: true,
            workerEngagement: {
                select: {
                    id: true,
                    worker: {
                        select: {
                            id: true,
                            workEmail: true,
                            externalAccounts: {
                                where: { provider: "microsoft_365" },
                                select: { externalId: true },
                                take: 1,
                            },
                        },
                    },
                },
            },
        },
    });
    if (!issue?.workerEngagement) {
        return { status: "failed", message: "Aufgabe nicht gefunden." };
    }

    await prisma.issue.update({
        where: { id: issue.id },
        data: { automation: params.automation },
    });

    if (params.automation === TEAM_DEPARTURE_MAIL) {
        const mailed = await sendIssueMail({
            organizationId: params.organizationId,
            issueId: issue.id,
            senderAddress: params.senderAddress,
            origin: "departure",
            once: "departure",
        });
        if (mailed.status === "failed") return mailed;
        await markIssueDone({
            issueId: issue.id,
            previousStatus: issue.status,
            actorUserId: params.actorUserId,
        });
        return { status: "completed", alreadyBlocked: false };
    }

    if (params.automation === ARBEITSZEUGNIS) {
        return {
            status: "failed",
            message: "Bitte prüfen Sie das Arbeitszeugnis vor dem Versand.",
        };
    }

    if (params.automation !== O365_BLOCK_SIGN_IN) {
        return {
            status: "failed",
            message: "Diese Automatisierung gibt es nicht.",
        };
    }

    const worker = issue.workerEngagement.worker;
    const userKey =
        worker.externalAccounts[0]?.externalId.trim() ||
        worker.workEmail?.trim() ||
        "";
    if (!userKey) {
        return {
            status: "failed",
            message:
                "Für diesen Mitarbeiter ist kein Microsoft-365-Konto hinterlegt.",
        };
    }

    if (!integrationsLive()) {
        return { status: "failed", message: NOT_LIVE_MESSAGE };
    }
    const config = await loadMicrosoft365Config(params.organizationId);
    if (!config) {
        return {
            status: "failed",
            message: "Microsoft 365 ist für diese Organisation nicht eingerichtet.",
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

    await completeAutomatedTask({
        issueId: issue.id,
        previousStatus: issue.status,
        actorUserId: params.actorUserId,
        workerId: worker.id,
        externalId: blocked.externalId,
    });

    return { status: "completed", alreadyBlocked: blocked.alreadyBlocked };
}

async function issueForAutomation(organizationId: string, issueId: string) {
    return prisma.issue.findFirst({
        where: {
            id: issueId,
            workerEngagement: { organizationId },
        },
        select: {
            id: true,
            status: true,
            workerEngagement: { select: { id: true } },
        },
    });
}

export async function arbeitszeugnisPreview(params: {
    organizationId: string;
    issueId: string;
}) {
    const issue = await issueForAutomation(
        params.organizationId,
        params.issueId,
    );
    if (!issue?.workerEngagement)
        return {
            status: "failed" as const,
            message: "Aufgabe nicht gefunden.",
        };
    return previewArbeitszeugnis({
        organizationId: params.organizationId,
        engagementId: issue.workerEngagement.id,
    });
}

export async function confirmArbeitszeugnis(params: {
    organizationId: string;
    issueId: string;
    actorUserId: string;
    artifactId: string;
}): Promise<RunTaskAutomationResult> {
    const issue = await issueForAutomation(
        params.organizationId,
        params.issueId,
    );
    if (!issue?.workerEngagement)
        return { status: "failed", message: "Aufgabe nicht gefunden." };

    const mailed = await sendArbeitszeugnis({
        organizationId: params.organizationId,
        engagementId: issue.workerEngagement.id,
        artifactId: params.artifactId,
        actorUserId: params.actorUserId,
    });
    if (mailed.status === "failed") return mailed;

    await prisma.issue.update({
        where: { id: issue.id },
        data: { automation: ARBEITSZEUGNIS },
    });
    await markIssueDone({
        issueId: issue.id,
        previousStatus: issue.status,
        actorUserId: params.actorUserId,
    });
    return { status: "completed", alreadyBlocked: false };
}

export async function prepareLetterForIssue(
    params: {
        organizationId: string;
        issueId: string;
        values: Record<string, string>;
    },
    draftOnly = false,
) {
    const issue = await issueForAutomation(
        params.organizationId,
        params.issueId,
    );
    if (!issue?.workerEngagement)
        return {
            status: "failed" as const,
            message: "Aufgabe nicht gefunden.",
        };
    const input = {
        organizationId: params.organizationId,
        engagementId: issue.workerEngagement.id,
        values: params.values,
    };
    if (draftOnly) {
        await saveArbeitszeugnisDraft(input);
        return { status: "saved" as const };
    }
    return {
        status: "prepared" as const,
        data: await prepareArbeitszeugnisPdf(input),
    };
}
