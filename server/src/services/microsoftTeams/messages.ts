import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { issueVisibleToViewer } from "@/services/issueVisibility";
import {
    integrationsLive,
    NOT_LIVE_MESSAGE,
} from "@/services/integrations/runtime";
import { applyEngagementMailTemplate } from "@/services/engagementMail";
import { formatWelcomeEntryDate } from "@/services/welcomeMail";
import {
    accessToken,
    assertActiveMember,
    connectionStatus,
    TeamsError,
    type Actor,
} from "./connection";
import {
    authenticationRejected,
    graphChannelPath,
    graphFetch,
    listChannels,
    postChannelMessage,
} from "./graph";

export const TEAMS_SEQUENCE = "microsoft_send_teams_message";
const includeDestinations = {
    destinations: { orderBy: { id: "asc" as const } },
};
export async function taskContext(
    actor: Actor,
    issueId: string,
    db: Prisma.TransactionClient = prisma,
) {
    await assertActiveMember(actor, db);
    const issue = await db.issue.findFirst({
        where: {
            id: issueId,
            workerEngagement: { organizationId: actor.organizationId },
            ...issueVisibleToViewer(actor.userId),
        },
        include: {
            mailTemplate: true,
            workerEngagement: { include: { worker: true } },
        },
    });
    if (!issue || issue.sequence !== TEAMS_SEQUENCE)
        throw new TeamsError(
            "task_not_found",
            "Teams-Aufgabe nicht gefunden.",
            404,
        );
    return issue;
}
function renderBody(issue: Awaited<ReturnType<typeof taskContext>>) {
    const worker = issue.workerEngagement!.worker;
    if (
        !issue.mailTemplate ||
        issue.mailTemplate.organizationId !==
            issue.workerEngagement!.organizationId ||
        !issue.mailTemplate.body.trim()
    ) {
        throw new TeamsError(
            "template_required",
            "Bitte eine Nachrichtenvorlage mit Inhalt hinterlegen.",
        );
    }
    return applyEngagementMailTemplate(issue.mailTemplate.body, {
        firstName: worker.firstName.trim(),
        lastName: worker.lastName.trim(),
        workEmail: worker.workEmail || "",
        position: worker.position || "",
        entryDate: formatWelcomeEntryDate(worker.entryDate),
        exitDate: formatWelcomeEntryDate(worker.exitDate),
    });
}
export async function teamsPreview(actor: Actor, issueId: string) {
    const issue = await taskContext(actor, issueId);
    const connection = await connectionStatus(actor);
    const operation = await prisma.teamsSend.findUnique({
        where: { issueId },
        include: includeDestinations,
    });
    // Failed/successful delivery details may contain private channel names. Never expose another actor's destinations.
    if (operation && operation.actorUserId !== actor.userId) {
        throw new TeamsError(
            "different_sender",
            "Eine andere Person hat die Zustellung dieser Aufgabe bereits begonnen.",
            409,
        );
    }
    return {
        body: operation?.body ?? renderBody(issue),
        connection,
        operation,
        completed: issue.status === "done",
    };
}
async function sendLock<T>(
    issueId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
) {
    return prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<
            Array<{ locked: boolean }>
        >`SELECT pg_try_advisory_xact_lock(hashtextextended(${`teams-send:${issueId}`}, 0)) AS locked`;
        if (!locked[0]?.locked)
            throw new TeamsError(
                "send_in_progress",
                "Diese Nachricht wird bereits verarbeitet.",
                409,
            );
        return fn(tx);
    });
}
async function finishIfComplete(
    tx: Prisma.TransactionClient,
    actor: Actor,
    issueId: string,
    sendId: string,
) {
    const remaining = await tx.teamsSendDestination.count({
        where: { sendId, status: { not: "sent" } },
    });
    if (remaining) return;
    const issue = await tx.issue.findUniqueOrThrow({ where: { id: issueId } });
    await tx.teamsSend.update({
        where: { id: sendId },
        data: { status: "completed", leaseUntil: null },
    });
    await tx.issue.update({
        where: { id: issueId },
        data: { status: "done", completedAt: new Date() },
    });
    await tx.issueAuditLog.create({
        data: {
            issueId,
            actorUserId: actor.userId,
            action: "teams.sent",
            oldValue: { status: issue.status },
            newValue: { status: "done", sendId },
        },
    });
}
export async function sendTeams(
    actor: Actor,
    issueId: string,
    input: {
        idempotencyKey: string;
        destinations: Array<{ teamId: string; channelId: string }>;
    },
) {
    await taskContext(actor, issueId);
    if (!integrationsLive()) throw new TeamsError("not_live", NOT_LIVE_MESSAGE);
    const auth = await accessToken(actor);
    const existing = await prisma.teamsSend.findUnique({
        where: { issueId },
        include: includeDestinations,
    });
    let choices = new Map<string, string>();
    if (!existing) {
        const discovered = await listChannels(actor);
        choices = new Map(
            discovered.channels.map((channel) => [
                `${channel.teamId}:${channel.channelId}`,
                channel.label,
            ]),
        );
    }
    const operation = await sendLock(issueId, async (tx) => {
        const currentIssue = await taskContext(actor, issueId, tx);
        let op = await tx.teamsSend.findUnique({
            where: { issueId },
            include: includeDestinations,
        });
        if (op) {
            if (
                op.actorUserId !== actor.userId ||
                op.microsoftUserId !== auth.connection.microsoftUserId ||
                op.tenantId !== auth.connection.tenantId
            ) {
                throw new TeamsError(
                    "different_sender",
                    "Diese Zustellung gehört zu einem anderen Microsoft-Konto.",
                    409,
                );
            }
            if (op.idempotencyKey !== input.idempotencyKey)
                throw new TeamsError(
                    "existing_send",
                    "Für diese Aufgabe besteht bereits eine Zustellung. Bitte Vorschau neu öffnen.",
                    409,
                );
            const requested = new Set(
                input.destinations.map((d) => `${d.teamId}:${d.channelId}`),
            );
            if (
                requested.size !== op.destinations.length ||
                op.destinations.some(
                    (d) => !requested.has(`${d.teamId}:${d.channelId}`),
                )
            ) {
                throw new TeamsError(
                    "destinations_changed",
                    "Die Empfänger einer begonnenen Zustellung können nicht geändert werden.",
                    409,
                );
            }
            if (op.status === "completed") return op;
            if (op.leaseUntil && op.leaseUntil > new Date())
                throw new TeamsError(
                    "send_in_progress",
                    "Die Nachricht wird bereits gesendet.",
                    409,
                );
            // A worker may have stopped after sending but before persisting Graph's response.
            await tx.teamsSendDestination.updateMany({
                where: { sendId: op.id, status: "posting" },
                data: {
                    status: "unknown",
                    error: "Zustellung nach Verbindungsabbruch unklar. Bitte in Teams prüfen.",
                },
            });
            if (
                op.destinations.some(
                    (d) => d.status === "unknown" || d.status === "posting",
                )
            ) {
                await tx.teamsSend.update({
                    where: { id: op.id },
                    data: { status: "needs_review", leaseUntil: null },
                });
                return tx.teamsSend.findUniqueOrThrow({
                    where: { id: op.id },
                    include: includeDestinations,
                });
            }
        } else {
            if (currentIssue.status === "done")
                throw new TeamsError(
                    "task_completed",
                    "Diese Aufgabe ist bereits erledigt.",
                    409,
                );
            const destinations = [
                ...new Map(
                    input.destinations.map((d) => [
                        `${d.teamId}:${d.channelId}`,
                        d,
                    ]),
                ).values(),
            ];
            if (
                !destinations.length ||
                destinations.some(
                    (d) => !choices.has(`${d.teamId}:${d.channelId}`),
                )
            ) {
                throw new TeamsError(
                    "invalid_channel",
                    "Bitte erreichbare Teams-Kanäle auswählen.",
                );
            }
            op = await tx.teamsSend.create({
                data: {
                    id: randomUUID(),
                    issueId,
                    organizationId: actor.organizationId,
                    actorUserId: actor.userId,
                    idempotencyKey: input.idempotencyKey,
                    microsoftUserId: auth.connection.microsoftUserId,
                    tenantId: auth.connection.tenantId,
                    senderName: auth.connection.displayName,
                    body: renderBody(currentIssue),
                    destinations: {
                        create: destinations.map((d) => ({
                            ...d,
                            label: choices.get(`${d.teamId}:${d.channelId}`)!,
                        })),
                    },
                },
                include: includeDestinations,
            });
        }
        return tx.teamsSend.update({
            where: { id: op.id },
            data: {
                status: "sending",
                leaseUntil: new Date(Date.now() + 120_000),
            },
            include: includeDestinations,
        });
    });
    if (operation.status !== "sending") return operation;
    try {
        for (const destination of operation.destinations) {
            if (
                destination.status === "sent" ||
                (destination.retryAfter && destination.retryAfter > new Date())
            )
                continue;
            await prisma.teamsSend.update({
                where: { id: operation.id },
                data: { leaseUntil: new Date(Date.now() + 120_000) },
            });
            // Re-check membership, organization enablement and the personal connection for each destination.
            const currentAuth = await accessToken(actor);
            if (
                currentAuth.connection.microsoftUserId !==
                    operation.microsoftUserId ||
                currentAuth.connection.tenantId !== operation.tenantId
            ) {
                throw new TeamsError(
                    "different_sender",
                    "Das verbundene Microsoft-Konto wurde geändert.",
                );
            }
            const channel = await graphFetch(
                currentAuth.token,
                graphChannelPath(destination.teamId, destination.channelId) +
                    "?$select=id,isArchived",
            );
            if (channel.status === 401) {
                await authenticationRejected(actor);
                throw new TeamsError(
                    "reconnect_required",
                    "Bitte Microsoft Teams erneut verbinden.",
                );
            }
            if (!channel.ok) {
                await prisma.teamsSendDestination.update({
                    where: { id: destination.id },
                    data: {
                        status: "failed",
                        error: "Kanal nicht mehr zugänglich.",
                    },
                });
                continue;
            }
            const details = (await channel.json()) as { isArchived?: boolean };
            if (details.isArchived) {
                await prisma.teamsSendDestination.update({
                    where: { id: destination.id },
                    data: {
                        status: "failed",
                        error: "Dieser Kanal ist archiviert.",
                    },
                });
                continue;
            }
            await prisma.teamsSendDestination.update({
                where: { id: destination.id },
                data: { status: "posting", error: null, retryAfter: null },
            });
            const outcome = await postChannelMessage(
                currentAuth.token,
                destination.teamId,
                destination.channelId,
                operation.body,
            );
            await prisma.teamsSendDestination.update({
                where: { id: destination.id },
                data: {
                    status: outcome.status,
                    graphMessageId: outcome.graphMessageId,
                    messageUrl: outcome.messageUrl,
                    error: outcome.error ?? null,
                    retryAfter: outcome.retryAfter ?? null,
                },
            });
            if (outcome.reconnect) {
                await authenticationRejected(actor);
                break;
            }
            // A throttle applies to the remaining batch too; do not send a burst of rejected requests.
            if (outcome.retryAfter) {
                await prisma.teamsSendDestination.updateMany({
                    where: {
                        sendId: operation.id,
                        status: { in: ["pending", "failed"] },
                    },
                    data: { retryAfter: outcome.retryAfter },
                });
                break;
            }
        }
    } finally {
        await prisma.$transaction(async (tx) => {
            await tx.teamsSendDestination.updateMany({
                where: { sendId: operation.id, status: "posting" },
                data: {
                    status: "unknown",
                    error: "Zustellung unklar. Bitte in Teams prüfen.",
                },
            });
            await tx.teamsSend.update({
                where: { id: operation.id },
                data: { status: "partial", leaseUntil: null },
            });
            await tx.issueAuditLog.create({
                data: {
                    issueId,
                    actorUserId: actor.userId,
                    action: "teams.delivery_attempt",
                    newValue: {
                        sendId: operation.id,
                        microsoftUserId: operation.microsoftUserId,
                    },
                },
            });
            await finishIfComplete(tx, actor, issueId, operation.id);
        });
    }
    return prisma.teamsSend.findUniqueOrThrow({
        where: { id: operation.id },
        include: includeDestinations,
    });
}

export async function reviewDestination(
    actor: Actor,
    issueId: string,
    destinationId: string,
    delivered: boolean,
) {
    await taskContext(actor, issueId);
    return sendLock(issueId, async (tx) => {
        const op = await tx.teamsSend.findUnique({
            where: { issueId },
            include: includeDestinations,
        });
        if (!op || op.actorUserId !== actor.userId)
            throw new TeamsError(
                "access_denied",
                "Kein Zugriff auf diese Zustellung.",
                403,
            );
        if (op.leaseUntil && op.leaseUntil > new Date())
            throw new TeamsError(
                "send_in_progress",
                "Bitte laufende Zustellung abwarten.",
                409,
            );
        const destination = op.destinations.find((d) => d.id === destinationId);
        if (
            !destination ||
            !["unknown", "posting"].includes(destination.status)
        )
            throw new TeamsError(
                "review_not_required",
                "Diese Zustellung benötigt keine Prüfung.",
            );
        await tx.teamsSendDestination.update({
            where: { id: destination.id },
            data: {
                status: delivered ? "sent" : "failed",
                error: delivered
                    ? null
                    : "In Teams geprüft: nicht zugestellt. Erneutes Senden freigegeben.",
            },
        });
        await tx.issueAuditLog.create({
            data: {
                issueId,
                actorUserId: actor.userId,
                action: "teams.delivery_reviewed",
                newValue: { sendId: op.id, destinationId, delivered },
            },
        });
        await finishIfComplete(tx, actor, issueId, op.id);
        return tx.teamsSend.findUniqueOrThrow({
            where: { id: op.id },
            include: includeDestinations,
        });
    });
}
