import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import AppError from "@/utils/AppError";
import { BAD_REQUEST } from "@/constants/http";

export const DEACTIVATION_SEQUENCES = [
    "crewmeister_deactivate_account",
    "microsoft_deactivate_account",
] as const;
export function isDeactivation(sequence: string | null | undefined) {
    return DEACTIVATION_SEQUENCES.some((value) => value === sequence);
}
export const executableStatuses = ["open", "error", "in_progress"] as const;
export function berlinToday(now = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
}
export function validateSchedule(value: string, now = new Date()) {
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(new Date(`${value}T00:00:00Z`).getTime()) ||
        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value ||
        value < berlinToday(now)
    ) {
        throw new AppError(
            BAD_REQUEST,
            "Bitte heute oder ein zukünftiges Datum wählen.",
        );
    }
    return new Date(`${value}T00:00:00Z`);
}
export async function lockDeactivation(
    tx: Prisma.TransactionClient,
    issueId: string,
) {
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`deactivation:${issueId}`}, 0))`;
}
export async function readDeactivationSchedule(
    organizationId: string,
    issueId: string,
) {
    const issue = await prisma.issue.findFirst({
        where: { id: issueId, workerEngagement: { organizationId } },
    });
    if (!issue || !isDeactivation(issue.sequence))
        throw new AppError(BAD_REQUEST, "Aufgabe nicht gefunden.");
    return {
        scheduledDeactivateAt:
            issue.scheduledDeactivateAt?.toISOString().slice(0, 10) ?? null,
    };
}
export async function saveDeactivationSchedule(params: {
    organizationId: string;
    issueId: string;
    actorUserId: string;
    scheduledDeactivateAt: string | null;
}) {
    const date =
        params.scheduledDeactivateAt === null
            ? null
            : validateSchedule(params.scheduledDeactivateAt);
    return prisma.$transaction(async (tx) => {
        await lockDeactivation(tx, params.issueId);
        const issue = await tx.issue.findFirst({
            where: {
                id: params.issueId,
                workerEngagement: { organizationId: params.organizationId },
            },
        });
        if (
            !issue ||
            !isDeactivation(issue.sequence) ||
            !executableStatuses.some((s) => s === issue.status)
        )
            throw new AppError(
                BAD_REQUEST,
                "Diese Aufgabe kann nicht geplant werden.",
            );
        if (
            issue.deactivationClaimUntil &&
            issue.deactivationClaimUntil > new Date()
        )
            throw new AppError(409, "Die Deaktivierung läuft bereits.");
        await tx.issue.update({
            where: { id: issue.id },
            data: {
                scheduledDeactivateAt: date,
                scheduledDeactivateByUserId: date ? params.actorUserId : null,
                deactivationClaimToken: null,
                deactivationClaimUntil: null,
            },
        });
        await tx.issueAuditLog.create({
            data: {
                issueId: issue.id,
                actorUserId: params.actorUserId,
                action: "issue.updated",
                oldValue: {
                    scheduledDeactivateAt:
                        issue.scheduledDeactivateAt
                            ?.toISOString()
                            .slice(0, 10) ?? null,
                },
                newValue: {
                    scheduledDeactivateAt: params.scheduledDeactivateAt,
                },
            },
        });
        return {
            scheduledDeactivateAt: params.scheduledDeactivateAt,
        };
    });
}

// A crashed process releases its claim after ten minutes. Network calls are bounded.
export async function claimDeactivation(params: {
    organizationId: string;
    issueId: string;
    actorUserId: string;
    scheduled?: boolean;
}) {
    return prisma.$transaction(async (tx) => {
        await lockDeactivation(tx, params.issueId);
        const issue = await tx.issue.findFirst({
            where: {
                id: params.issueId,
                workerEngagement: { organizationId: params.organizationId },
            },
        });
        const now = new Date();
        if (
            !issue ||
            !isDeactivation(issue.sequence) ||
            !executableStatuses.some((s) => s === issue.status) ||
            (issue.deactivationClaimUntil && issue.deactivationClaimUntil > now)
        )
            return null;
        if (
            params.scheduled &&
            (!issue.scheduledDeactivateAt ||
                issue.scheduledDeactivateAt.toISOString().slice(0, 10) >=
                    berlinToday(now))
        )
            return null;
        const token = randomUUID();
        const actorUserId = params.scheduled
            ? issue.scheduledDeactivateByUserId
            : params.actorUserId;
        if (!actorUserId)
            throw new Error("Geplante Deaktivierung ohne Benutzer.");
        await tx.issue.update({
            where: { id: issue.id },
            data: {
                deactivationClaimToken: token,
                deactivationClaimUntil: new Date(now.getTime() + 10 * 60_000),
                status: "in_progress",
                completedAt: null,
            },
        });
        await tx.issueAuditLog.create({
            data: {
                issueId: issue.id,
                actorUserId,
                action: "issue.updated",
                oldValue: { status: issue.status },
                newValue: {
                    status: "in_progress",
                    executionSource: params.scheduled ? "cron" : "manual",
                },
            },
        });
        return { token, actorUserId };
    });
}
export async function finishDeactivation(params: {
    issueId: string;
    token: string;
    actorUserId: string;
    succeeded: boolean;
    message?: string;
    scheduled?: boolean;
}) {
    await prisma.$transaction(async (tx) => {
        await lockDeactivation(tx, params.issueId);
        const issue = await tx.issue.findUniqueOrThrow({
            where: { id: params.issueId },
        });
        if (issue.deactivationClaimToken !== params.token)
            throw new Error("Deaktivierungsreservierung abgelaufen.");
        const status = params.succeeded ? "done" : "error";
        // Preserve a user's terminal status change made during an external request.
        const terminal =
            issue.status === "cancelled" || issue.status === "not_applicable";
        await tx.issue.update({
            where: { id: issue.id },
            data: {
                ...(!terminal
                    ? {
                          status,
                          completedAt: params.succeeded ? new Date() : null,
                      }
                    : {}),
                deactivationClaimToken: null,
                deactivationClaimUntil: null,
                ...(params.succeeded
                    ? {
                          scheduledDeactivateAt: null,
                          scheduledDeactivateByUserId: null,
                      }
                    : {}),
            },
        });
        await tx.issueAuditLog.create({
            data: {
                issueId: issue.id,
                actorUserId: params.actorUserId,
                action: "issue.updated",
                oldValue: {
                    status: issue.status,
                    scheduledDeactivateAt:
                        issue.scheduledDeactivateAt
                            ?.toISOString()
                            .slice(0, 10) ?? null,
                },
                newValue: {
                    status: terminal ? issue.status : status,
                    ...(params.succeeded
                        ? {
                              scheduledDeactivateAt: null,
                          }
                        : {}),
                    executionSource: params.scheduled ? "cron" : "manual",
                    ...(params.message
                        ? { automationError: params.message }
                        : {}),
                },
            },
        });
    });
}
