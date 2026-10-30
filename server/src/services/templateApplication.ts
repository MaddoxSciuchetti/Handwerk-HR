import { isDeactivation, validateSchedule } from "./integrations/deactivationSchedule";
import {
    integrationsMocked,
    MOCK_AUTOMATION_DELAY_MS,
} from "./integrations/localMock";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";
import { BAD_REQUEST } from "@/constants/http";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
    isMailSequence,
    normalizeRecipients,
    listBsbMailAddresses,
} from "./engagementMail";
import { listOrganizationIntegrations } from "./integrations/store";
import { runIssueSequence } from "./integrations/runSequence";
import {
    executionStatus,
    executionError,
} from "./integrations/issueExecutionStatus";
import { sendTeams } from "./microsoftTeams/messages";
import { connectionStatus } from "./microsoftTeams/connection";
import { randomUUID, createHash } from "node:crypto";

const recipient = z.object({
    kind: z.enum([
        "worker_private",
        "worker_work",
        "microsoft_group",
        "teams_channel",
    ]),
    label: z.string().trim().min(1).max(255),
    address: z.string().nullable().optional(),
    workerId: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
});
export const templateApplyInput = z.object({
    workerEngagementId: z.string().min(1),
    runAutomation: z.boolean().default(false),
    idempotencyKey: z.string().uuid().optional(),
    templateRevision: z.string().max(64).optional(),
    choices: z
        .record(
            z.string(),
            z.object({
                scheduledDeactivateAt: z.string().nullable().optional(),
                senderAddress: z.string().email().optional(),
                recipients: z.array(recipient).min(1).max(50).optional(),
                destinations: z
                    .array(
                        z.object({
                            teamId: z.string().min(1),
                            channelId: z.string().min(1),
                        }),
                    )
                    .min(1)
                    .max(50)
                    .optional(),
            }),
        )
        .default({}),
});
export type TemplateApplyInput = z.infer<typeof templateApplyInput>;
type Context = {
    workerId: string;
    organizationId: string;
    templateId: string;
    actorUserId: string;
};

async function loadTemplate(context: Context, engagementId: string) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: engagementId,
            workerId: context.workerId,
            organizationId: context.organizationId,
        },
        select: { id: true },
    });
    if (!engagement) throw new AppError(BAD_REQUEST, "Einsatz nicht gefunden.");
    const template = await prisma.issueTemplate.findFirst({
        where: {
            id: context.templateId,
            organizationId: context.organizationId,
        },
        include: { items: { orderBy: [{ orderIndex: "asc" }, { id: "asc" }] } },
    });
    if (!template) throw new AppError(BAD_REQUEST, "Template nicht gefunden.");
    return template;
}

function templateRevision(template: Awaited<ReturnType<typeof loadTemplate>>) {
    return createHash("sha256")
        .update(JSON.stringify(template.items))
        .digest("hex");
}

export async function templateApplicationPreview(
    context: Context,
    engagementId: string,
) {
    const template = await loadTemplate(context, engagementId);
    const mocked = integrationsMocked();
    const integrations = mocked
        ? []
        : await listOrganizationIntegrations(context.organizationId);
    const teams = !mocked && template.items.some(
        (item) => item.sequence === "microsoft_send_teams_message",
    )
        ? await connectionStatus({
              organizationId: context.organizationId,
              userId: context.actorUserId,
          })
        : null;
    return {
        id: template.id,
        name: template.name,
        mocked,
        revision: templateRevision(template),
        items: template.items.map((item) => {
            const integration = integrations.find(
                (i) => i.provider === item.integrationProvider,
            );
            return {
                id: item.id,
                title: item.title,
                sequence: item.sequence,
                integrationProvider: item.integrationProvider,
                blockedReason: mocked || !item.sequence
                    ? null
                    : item.sequence === "microsoft_send_teams_message"
                      ? !teams?.ready || teams.status !== "connected"
                          ? "Bitte Microsoft Teams in den Einstellungen verbinden."
                          : !teams.live
                            ? "Sequenzen werden in dieser Umgebung nicht ausgeführt."
                            : null
                      : !integration?.enabled
                        ? "Die Integration ist deaktiviert."
                        : !integration.ready
                          ? "Die Zugangsdaten sind unvollständig."
                          : !integration.live
                            ? "Sequenzen werden in dieser Umgebung nicht ausgeführt."
                            : null,
            };
        }),
    };
}

type Outcome = {
    issueId: string;
    status: "completed" | "failed" | "pending" | "scheduled";
    message?: string;
};

async function applicationTasks(issueIds: string[], organizationId: string) {
    return prisma.issue.findMany({
        where: { id: { in: issueIds }, workerEngagement: { organizationId } },
        select: { id: true, title: true, status: true, sequence: true, scheduledDeactivateAt: true, scheduledDeactivateTestAt: true },
        orderBy: { createdAt: "asc" },
    });
}

export async function readTemplateApplication(context: {
    workerId: string;
    organizationId: string;
}, engagementId: string) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: { id: engagementId, workerId: context.workerId, organizationId: context.organizationId },
        select: { id: true },
    });
    if (!engagement) throw new AppError(BAD_REQUEST, "Einsatz nicht gefunden.");
    const receipt = await prisma.templateApplication.findUnique({
        where: { workerEngagementId: engagementId },
    });
    if (!receipt) return null;
    const template = await prisma.issueTemplate.findFirst({
        where: { id: receipt.templateId, organizationId: context.organizationId },
        select: { name: true },
    });
    // Older demo receipts could be empty because the controller skipped existing items.
    // Read those existing tasks instead of presenting an empty successful run.
    const tasks = receipt.issueIds.length
        ? await applicationTasks(receipt.issueIds, context.organizationId)
        : await prisma.issue.findMany({
              where: {
                  workerEngagementId: engagementId,
                  workerEngagement: { organizationId: context.organizationId },
                  templateItem: { issueTemplateId: receipt.templateId },
              },
              select: { id: true, title: true, status: true, sequence: true, scheduledDeactivateAt: true, scheduledDeactivateTestAt: true },
              orderBy: { createdAt: "asc" },
          });
    // The receipt describes the original run. Tasks can be retried separately,
    // so the results panel must use their current state and latest error.
    const storedOutcomes = Array.isArray(receipt.outcomes)
        ? (receipt.outcomes as Outcome[])
        : [];
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const failedIds = tasks
        .filter((task) => task.status === "error")
        .map((task) => task.id);
    const errors = failedIds.length
        ? await prisma.issueAuditLog.findMany({
              where: {
                  issueId: { in: failedIds },
                  action: "issue.updated",
                  newValue: { path: ["status"], equals: "error" },
              },
              orderBy: { createdAt: "desc" },
              distinct: ["issueId"],
              select: { issueId: true, newValue: true },
          })
        : [];
    const latestError = new Map(
        errors.map((entry) => {
            const value = entry.newValue as { automationError?: string } | null;
            return [entry.issueId, value?.automationError];
        }),
    );
    const outcomes = storedOutcomes.map((outcome): Outcome => {
        const task = taskById.get(outcome.issueId);
        if (!task) return outcome;
        if (task.status === "done")
            return { issueId: task.id, status: "completed" };
        if (task.status === "error")
            return {
                issueId: task.id,
                status: "failed",
                message: latestError.get(task.id) ?? outcome.message,
            };
        if (task.scheduledDeactivateTestAt && isDeactivation(task.sequence) &&
            (task.status === "open" || task.status === "in_progress"))
            return { issueId: task.id, status: "scheduled", message: `Geplant · ${task.scheduledDeactivateTestAt.toISOString()}` };
        if (task.scheduledDeactivateAt && isDeactivation(task.sequence) &&
            (task.status === "open" || task.status === "in_progress"))
            return { issueId: task.id, status: "scheduled", message: `Geplant · ${task.scheduledDeactivateAt.toISOString().slice(0, 10)}` };
        return { issueId: task.id, status: "pending" };
    });
    return {
        templateName: template?.name ?? "Template",
        idempotencyKey: receipt.idempotencyKey,
        dismissed: Boolean(receipt.resultsDismissedAt),
        result: {
            count: tasks.length,
            issueIds: tasks.map((task) => task.id),
            outcomes,
            running: !receipt.completedAt,
            tasks,
        },
    };
}

export async function dismissTemplateApplicationResults(
    context: { workerId: string; organizationId: string },
    engagementId: string,
) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: engagementId,
            workerId: context.workerId,
            organizationId: context.organizationId,
        },
        select: { id: true },
    });
    if (!engagement) throw new AppError(BAD_REQUEST, "Einsatz nicht gefunden.");
    const receipt = await prisma.templateApplication.findUnique({
        where: { workerEngagementId: engagementId },
    });
    if (!receipt)
        throw new AppError(BAD_REQUEST, "Kein Template-Durchlauf vorhanden.");
    if (!receipt.completedAt)
        throw new AppError(
            BAD_REQUEST,
            "Der Durchlauf ist noch nicht abgeschlossen.",
        );
    if (!receipt.resultsDismissedAt) {
        await prisma.templateApplication.update({
            where: { id: receipt.id },
            data: { resultsDismissedAt: new Date() },
        });
    }
    return { dismissed: true };
}

export async function applyTemplateApplication(
    context: Context,
    input: TemplateApplyInput,
    createTasks: (
        tx: Prisma.TransactionClient,
        template: Awaited<ReturnType<typeof loadTemplate>>,
    ) => Promise<{ count: number; issueIds: string[] }>,
) {
    const template = await loadTemplate(context, input.workerEngagementId);
    // A new explicit demo click can replace a finished receipt; retries still reuse it.
    const repeatDemo = (receipt: { completedAt: Date | null; idempotencyKey: string }) =>
        integrationsMocked() && Boolean(receipt.completedAt) &&
        Boolean(input.idempotencyKey) && receipt.idempotencyKey !== input.idempotencyKey;
    const prior = await prisma.templateApplication.findUnique({
        where: { workerEngagementId: input.workerEngagementId },
    });
    if (prior && !repeatDemo(prior)) {
        if (prior.templateId !== context.templateId)
            throw new AppError(
                BAD_REQUEST,
                "Für diesen Einsatz wurde bereits ein Template angewendet.",
            );
        return {
            count: prior.issueIds.length,
            issueIds: prior.issueIds,
            outcomes: prior.outcomes,
            running: !prior.completedAt,
            applicationId: prior.id,
            tasks: await applicationTasks(prior.issueIds, context.organizationId),
        };
    }
    if (
        input.templateRevision &&
        input.templateRevision !== templateRevision(template)
    )
        throw new AppError(
            BAD_REQUEST,
            "Template wurde geändert. Bitte erneut auswählen.",
        );
    // Validate required choices without sending anything or modifying recipients.
    const mailItems = template.items.filter((item) =>
        isMailSequence(item.sequence),
    );
    const normalized = new Map<
        string,
        Awaited<ReturnType<typeof normalizeRecipients>>
    >();
    if (input.runAutomation) {
        const senders = mailItems.length
            ? await listBsbMailAddresses(context.organizationId, context.actorUserId)
            : null;
        for (const item of template.items) {
            const choice = input.choices[item.id];
            if (choice?.scheduledDeactivateAt != null) {
                if (!isDeactivation(item.sequence)) throw new AppError(BAD_REQUEST, "Diese Aufgabe kann nicht geplant werden.");
                validateSchedule(choice.scheduledDeactivateAt);
            }
            if (isMailSequence(item.sequence)) {
                if (!choice?.senderAddress || !choice.recipients?.length)
                    throw new AppError(
                        BAD_REQUEST,
                        "Bitte Absender und Empfänger wählen.",
                    );
                if (
                    !senders?.addresses.some(
                        (s) =>
                            s.kind === "mailbox" &&
                            s.email.toLowerCase() ===
                                choice.senderAddress!.toLowerCase(),
                    )
                )
                    throw new AppError(BAD_REQUEST, "Absender nicht gefunden.");
                normalized.set(
                    item.id,
                    await normalizeRecipients(
                        context.organizationId,
                        choice.recipients,
                    ),
                );
            }
            if (
                item.sequence === "microsoft_send_teams_message" &&
                !choice?.destinations?.length
            )
                throw new AppError(BAD_REQUEST, "Bitte Teams-Kanäle wählen.");
        }
    }
    const accepted = await prisma.$transaction(
        async (tx) => {
            // Serialize applications per engagement, including concurrent clicks with different keys.
            await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`template-apply:${input.workerEngagementId}`}, 0))`;
            const existing = await tx.templateApplication.findUnique({
                where: { workerEngagementId: input.workerEngagementId },
            });
            if (existing && !repeatDemo(existing)) {
                if (existing.templateId !== context.templateId)
                    throw new AppError(
                        BAD_REQUEST,
                        "Für diesen Einsatz wurde bereits ein Template angewendet.",
                    );
                return { receipt: existing, fresh: false };
            }
            const created = await createTasks(tx, template);
            if (input.runAutomation && Object.values(input.choices).some((choice) => choice.scheduledDeactivateAt)) {
                const issues = await tx.issue.findMany({ where: { id: { in: created.issueIds } }, select: { id: true, templateItemId: true } });
                for (const issue of issues) {
                    const date = input.choices[issue.templateItemId ?? ""]?.scheduledDeactivateAt;
                    if (!date) continue;
                    await tx.issue.update({ where: { id: issue.id }, data: {
                        scheduledDeactivateAt: validateSchedule(date), scheduledDeactivateByUserId: context.actorUserId,
                    } });
                    await tx.issueAuditLog.create({ data: {
                        issueId: issue.id, actorUserId: context.actorUserId, action: "issue.updated",
                        oldValue: { scheduledDeactivateAt: null }, newValue: { scheduledDeactivateAt: date },
                    } });
                }
            }
            const data = {
                workerEngagementId: input.workerEngagementId,
                templateId: context.templateId,
                actorUserId: context.actorUserId,
                idempotencyKey: input.idempotencyKey ?? randomUUID(),
                runAutomation: input.runAutomation,
                issueIds: created.issueIds,
                outcomes: [],
                completedAt: input.runAutomation ? null : new Date(),
                resultsDismissedAt: null,
            };
            const receipt = existing
                ? await tx.templateApplication.update({ where: { id: existing.id }, data })
                : await tx.templateApplication.create({ data });
            return { receipt, fresh: true };
        },
        { timeout: 30_000 },
    );
    const receipt = accepted.receipt;
    if (!accepted.fresh)
        return {
            count: receipt.issueIds.length,
            issueIds: receipt.issueIds,
            outcomes: receipt.outcomes,
            running: !receipt.completedAt,
            applicationId: receipt.id,
            tasks: await applicationTasks(receipt.issueIds, context.organizationId),
        };
        const outcomes: Outcome[] = [];
    if (input.runAutomation) {
        const issues = await prisma.issue.findMany({
            where: { id: { in: receipt.issueIds } },
            select: { id: true, templateItemId: true },
        });
        // Run one mocked task at a time so the list and progress bar advance together.
        const mocked = integrationsMocked();
        const mockIssueCount = mocked
            ? issues.filter((issue) =>
                  template.items.some(
                      (item) =>
                          item.id === issue.templateItemId &&
                          item.sequence &&
                          item.integrationProvider,
                  ),
              ).length
            : 0;
        const mockStepDelayMs = mockIssueCount
            ? Math.round(MOCK_AUTOMATION_DELAY_MS / mockIssueCount)
            : 0;
        for (const item of template.items) {
            const issue = issues.find(
                (issue) => issue.templateItemId === item.id,
            );
            if (!issue || !item.sequence || !item.integrationProvider) continue;
            const choice = input.choices[item.id];
            let outcome: Outcome;
            try {
                if (isMailSequence(item.sequence)) {
                    await prisma.issue.update({
                        where: { id: issue.id },
                        data: {
                            mailSenderAddress: choice.senderAddress,
                            automationRecipients: normalized.get(item.id)!,
                        },
                    });
                }
                if (isDeactivation(item.sequence) && choice?.scheduledDeactivateAt) {
                    outcome = { issueId: issue.id, status: "scheduled", message: `Geplant · ${choice.scheduledDeactivateAt}` };
                } else if (mocked) {
                    await executionStatus(
                        issue.id,
                        context.actorUserId,
                        "in_progress",
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, mockStepDelayMs),
                    );
                    await executionStatus(
                        issue.id, context.actorUserId, "done",
                        "Lokale Simulation: Erfolg der Integration bestätigt.",
                    );
                    outcome = {
                        issueId: issue.id,
                        status: "completed",
                        message: "Lokale Simulation erfolgreich.",
                    };
                } else if (item.sequence === "microsoft_send_teams_message") {
                    await executionStatus(
                        issue.id,
                        context.actorUserId,
                        "in_progress",
                    );
                    const op = await sendTeams(
                        {
                            organizationId: context.organizationId,
                            userId: context.actorUserId,
                        },
                        issue.id,
                        {
                            idempotencyKey: `${receipt.id}:${issue.id}`,
                            destinations: choice.destinations!,
                        },
                    );
                    if (op.status === "completed")
                        outcome = { issueId: issue.id, status: "completed" };
                    else if (
                        op.destinations.some(
                            (d) =>
                                d.status === "unknown" ||
                                d.status === "posting",
                        )
                    )
                        outcome = {
                            issueId: issue.id,
                            status: "pending",
                            message:
                                "Zustellung unklar. Bitte in der Aufgabe prüfen.",
                        };
                    else
                        outcome = {
                            issueId: issue.id,
                            status: "failed",
                            message:
                                op.destinations.find((d) => d.error)?.error ??
                                "Teams-Nachricht konnte nicht gesendet werden.",
                        };
                    if (outcome.status === "failed")
                        await executionStatus(
                            issue.id,
                            context.actorUserId,
                            "error",
                            outcome.message,
                        );
                } else
                    outcome = {
                        issueId: issue.id,
                        ...(await runIssueSequence({
                            organizationId: context.organizationId,
                            issueId: issue.id,
                            actorUserId: context.actorUserId,
                            senderAddress: choice?.senderAddress,
                        })),
                    };
            } catch (error) {
                outcome = {
                    issueId: issue.id,
                    status: "failed",
                    message: executionError(error),
                };
                await executionStatus(
                    issue.id,
                    context.actorUserId,
                    "error",
                    outcome.message,
                );
            }
            outcomes.push(outcome);
            await prisma.templateApplication.update({
                where: { id: receipt.id },
                data: { outcomes },
            });
        }
    }
    await prisma.templateApplication.update({
        where: { id: receipt.id },
        data: { outcomes, completedAt: new Date() },
    });
    return {
        count: receipt.issueIds.length,
        issueIds: receipt.issueIds,
        outcomes,
        running: false,
        applicationId: receipt.id,
        tasks: await applicationTasks(receipt.issueIds, context.organizationId),
    };
}
