import { issueStatusLabel } from "@/constants/issueStatus.consts";
import { APP_ORIGIN } from "@/constants/env";
import {
    isTaskAutomationId,
    taskAutomationName,
} from "@/constants/taskAutomation.consts";
import { prisma } from "@/lib/prisma";
import { INTEGRATION_SEQUENCES, SEQUENCE_PROVIDER } from "@/services/integrations/catalog";
import type { IntegrationSequence } from "@prisma/client";
import type { IssueStatus } from "@prisma/client";
import { issueVisibleToViewer } from "@/services/issueVisibility";
import {
    attachMentionFlag,
    markIssueMentionsSeen,
    recordIssueMentions,
    unreadMentionInclude,
} from "@/services/issueMentions";
import { createIssue, updateIssue } from "@/services/worker.service";
import AppError from "@/utils/AppError";
import { BAD_REQUEST } from "@/constants/http";
import { getTaskMentionTemplate } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/sendMail";

export type TaskHistoryChange = {
    field: string;
    from: string | null;
    to: string | null;
};

export type TaskHistoryActorJson = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
};

export type TaskHistoryAuditEntry = {
    kind: "audit";
    id: string;
    action: string;
    createdAt: Date;
    actorUser: TaskHistoryActorJson | null;
    status: {
        id: string;
        name: string;
        color: string | null;
    } | null;
    changes: TaskHistoryChange[];
};

export type TaskHistoryCommentEntry = {
    kind: "comment";
    id: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    user: TaskHistoryActorJson;
};

export type TaskHistoryItem = TaskHistoryAuditEntry | TaskHistoryCommentEntry;

export const queryTasks = async (orgId: string, viewerUserId: string) => {
    const issues = await prisma.issue.findMany({
        where: {
            // Legacy mention notifications are not standalone tasks.
            assigneeOnly: false,
            AND: [
                {
                    OR: [
                        { workerEngagement: { organizationId: orgId } },
                        { organizationId: orgId },
                    ],
                },
                issueVisibleToViewer(viewerUserId),
            ],
        },
        // Tasks created together need an immutable tie-breaker across updates.
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        include: {
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            workerEngagement: {
                select: {
                    workerId: true,
                    templateApplication: { select: { id: true, completedAt: true, resultsDismissedAt: true } },
                    worker: {
                        select: { firstName: true, lastName: true },
                    },
                },
            },
            mentions: unreadMentionInclude(viewerUserId),
        },
    });
    return issues.map(attachMentionFlag);
};

async function taskSequenceFields(
    orgId: string,
    body: { sequence?: unknown; mailTemplateId?: unknown; mailSenderAddress?: unknown; microsoftAccountId?: unknown },
) {
    if (body.sequence === undefined) return {};
    if (body.sequence === null || body.sequence === "none" || body.sequence === "") {
        return {
            integrationProvider: null,
            sequence: null,
            mailTemplateId: null,
            mailSenderAddress: null,
            microsoftAccountId: null,
        };
    }
    if (!INTEGRATION_SEQUENCES.includes(body.sequence as IntegrationSequence)) {
        throw new AppError(BAD_REQUEST, "Ungültige Automation.");
    }
    const sequence = body.sequence as IntegrationSequence;
    const integrationProvider = SEQUENCE_PROVIDER[sequence];
    const integration = await prisma.organizationIntegration.findUnique({
        where: { organizationId_provider: { organizationId: orgId, provider: integrationProvider } },
        select: { enabled: true },
    });
    if (!integration?.enabled) {
        throw new AppError(BAD_REQUEST, "Diese Integration ist nicht aktiv.");
    }
    const mailTemplateId = (sequence === "microsoft_send_email" || sequence === "microsoft_send_teams_message")
        ? (typeof body.mailTemplateId === "string" ? body.mailTemplateId.trim() : "")
        : null;
    if (sequence === "microsoft_send_email" || sequence === "microsoft_send_teams_message") {
        if (!mailTemplateId) {
            throw new AppError(BAD_REQUEST, "Bitte wähle eine E-Mail-Vorlage.");
        }
        const template = await prisma.mailTemplate.findFirst({
            where: { id: mailTemplateId, organizationId: orgId },
            select: { id: true, ...(sequence === "microsoft_send_teams_message" ? { body: true } : {}) },
        });
        if (sequence === "microsoft_send_teams_message" && !template?.body.trim()) {
            throw new AppError(BAD_REQUEST, "Bitte eine Nachrichtenvorlage mit Inhalt wählen.");
        }
        if (!template) {
            throw new AppError(BAD_REQUEST, "Die E-Mail-Vorlage wurde nicht gefunden.");
        }
    }
    const rawSender =
        typeof body.mailSenderAddress === "string" ? body.mailSenderAddress.trim() : "";
    const mailSenderAddress =
        sequence === "microsoft_send_email" ? rawSender : null;
    if (
        sequence === "microsoft_send_email" &&
        (!mailSenderAddress || !mailSenderAddress.includes("@") || mailSenderAddress.length > 254)
    ) {
        throw new AppError(BAD_REQUEST, "Bitte wähle einen Absender.");
    }
    const microsoftAccountId = sequence === "microsoft_deactivate_account"
        ? (typeof body.microsoftAccountId === "string" ? body.microsoftAccountId.trim() || null : undefined)
        : null;
    if (microsoftAccountId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(microsoftAccountId)) {
        throw new AppError(BAD_REQUEST, "Bitte gib eine gültige Microsoft-Konto-ID ein.");
    }
    return { integrationProvider, sequence, mailTemplateId, mailSenderAddress, microsoftAccountId, automation: null };
}

export async function createTaskInOrg(
    orgId: string,
    userId: string,
    payload: unknown,
) {
    const body = (payload ?? {}) as {
        title?: string;
        status?: IssueStatus;
        assigneeUserId?: string;
        workerEngagementId?: string;
        automation?: string | null;
        sequence?: string | null;
        mailTemplateId?: string | null;
        mailSenderAddress?: string | null;
        microsoftAccountId?: string | null;
    };
    const workerEngagementId = body.workerEngagementId?.trim() ?? "";
    if (!workerEngagementId) {
        throw new Error("Engagement fehlt");
    }

    const engagement = await prisma.workerEngagement.findFirst({
        where: { id: workerEngagementId, organizationId: orgId },
    });
    if (!engagement) {
        throw new Error("Engagement not found for organization");
    }

    let automation: string | null | undefined;
    if (
        body.automation === null ||
        body.automation === "none" ||
        body.automation === ""
    ) {
        automation = null;
    } else if (
        typeof body.automation === "string" &&
        isTaskAutomationId(body.automation)
    ) {
        automation = body.automation;
    }

    const sequenceFields = await taskSequenceFields(orgId, body);
    const title = body.title?.trim() || "Neue Aufgabe";

    return createIssue({
        workerEngagementId: engagement.id,
        createdByUserId: userId,
        status: body.status ?? "open",
        title,
        assigneeUserId: body.assigneeUserId || undefined,
        automation,
        ...sequenceFields,
    });
}

export async function deleteTasksInOrg(orgId: string, taskIds: string[]) {
    if (!taskIds.length) return { count: 0 };
    return prisma.issue.deleteMany({
        where: {
            id: { in: taskIds },
            OR: [
                { workerEngagement: { organizationId: orgId } },
                { organizationId: orgId },
            ],
        },
    });
}

export async function updateTaskInOrg(
    orgId: string,
    userId: string,
    taskId: string,
    payload: unknown,
) {
    const existing = await prisma.issue.findFirst({
        where: {
            id: taskId,
            OR: [
                { workerEngagement: { organizationId: orgId } },
                { organizationId: orgId },
            ],
        },
        select: { id: true, workerEngagementId: true },
    });
    if (!existing) {
        throw new Error("Task not found for organization");
    }

    const body = (payload ?? {}) as {
        workerEngagementId?: string;
        title?: string;
        status?: IssueStatus;
        assigneeUserId?: string;
        automation?: string | null;
        sequence?: string | null;
        mailTemplateId?: string | null;
        mailSenderAddress?: string | null;
        microsoftAccountId?: string | null;
    };

    let automation: string | null | undefined;
    if (body.automation === null || body.automation === "none" || body.automation === "") {
        automation = null;
    } else if (
        typeof body.automation === "string" &&
        isTaskAutomationId(body.automation)
    ) {
        automation = body.automation;
    }

    const sequenceFields = await taskSequenceFields(orgId, body);
    const assigneeUserId =
        body.assigneeUserId === undefined
            ? undefined
            : body.assigneeUserId.trim() || null;
    const newWorkerEngagementId = body.workerEngagementId?.trim();
    if (body.workerEngagementId !== undefined && !newWorkerEngagementId) {
        throw new AppError(BAD_REQUEST, "Bitte wähle einen Handwerker aus.");
    }
    if (newWorkerEngagementId && newWorkerEngagementId !== existing.workerEngagementId) {
        const target = await prisma.workerEngagement.findFirst({
            where: { id: newWorkerEngagementId, organizationId: orgId },
            select: { id: true },
        });
        if (!target) throw new AppError(BAD_REQUEST, "Engagement nicht gefunden.");
    }
    if (sequenceFields.sequence && !existing.workerEngagementId) {
        throw new AppError(BAD_REQUEST, "Bitte wähle einen Handwerker aus.");
    }

    if (!existing.workerEngagementId) {
        return prisma.issue.update({
            where: { id: existing.id },
            data: {
                ...(newWorkerEngagementId ? { workerEngagementId: newWorkerEngagementId } : {}),
                ...(body.title !== undefined ? { title: body.title } : {}),
                ...(body.status !== undefined ? { status: body.status } : {}),
                ...(assigneeUserId !== undefined ? { assigneeUserId } : {}),
                ...(automation !== undefined ? { automation } : {}),
                ...sequenceFields,
            },
        });
    }

    return updateIssue({
        issueId: existing.id,
        workerEngagementId: existing.workerEngagementId,
        newWorkerEngagementId,
        actorUserId: userId,
        title: body.title,
        status: body.status,
        assigneeUserId,
        automation,
        ...sequenceFields,
    });
}

const HUMAN_READABLE_FIELDS = new Set([
    "workerEngagementId",
    "title",
    "description",
    "status",
    "statusId",
    "assigneeUserId",
    "priority",
    "dueDate",
    "scheduledDeactivateAt",
    "executionSource",
    "automation",
    "integrationProvider",
    "sequence",
    "mailTemplateId",
    "mailSenderAddress",
    "automationError",
    "microsoftAccountId",
]);

const PRIORITY_LABELS: Record<string, string> = {
    no_priority: "Keine Priorität",
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
    urgent: "Dringend",
};

type ChangeResolvers = {
    userName: (id: string) => string | null;
    engagementName: (id: string) => string | null;
};

function valueToString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (value instanceof Date) return value.toISOString();
    return JSON.stringify(value);
}

function resolveFieldValue(
    field: string,
    rawValue: unknown,
    resolvers: ChangeResolvers,
): string | null {
    const stringValue = valueToString(rawValue);
    if (stringValue === null) return null;

    if (field === "status" || field === "statusId") {
        return issueStatusLabel(stringValue);
    }
    if (field === "assigneeUserId") {
        return resolvers.userName(stringValue) ?? stringValue;
    }
    if (field === "workerEngagementId") {
        return resolvers.engagementName(stringValue) ?? "Entferntes Engagement";
    }
    if (field === "priority") {
        return PRIORITY_LABELS[stringValue] ?? stringValue;
    }
    if (field === "automation") {
        return taskAutomationName(stringValue);
    }
    return stringValue;
}

function diffAuditValues(
    oldValue: unknown,
    newValue: unknown,
    resolvers: ChangeResolvers,
): TaskHistoryChange[] {
    const oldObj =
        oldValue && typeof oldValue === "object"
            ? (oldValue as Record<string, unknown>)
            : {};
    const newObj =
        newValue && typeof newValue === "object"
            ? (newValue as Record<string, unknown>)
            : {};

    const fields = new Set<string>([
        ...Object.keys(oldObj),
        ...Object.keys(newObj),
    ]);

    const changes: TaskHistoryChange[] = [];
    for (const field of fields) {
        if (!HUMAN_READABLE_FIELDS.has(field)) continue;
        if (valueToString(oldObj[field]) === valueToString(newObj[field])) continue;
        const normalizedField = field === "statusId" ? "status" : field;
        if (changes.some((c) => c.field === normalizedField)) continue;
        changes.push({
            field: normalizedField,
            from: resolveFieldValue(field, oldObj[field], resolvers),
            to: resolveFieldValue(field, newObj[field], resolvers),
        });
    }
    return changes;
}

function readStatusFromAuditBlob(
    blob: Record<string, unknown> | null,
): IssueStatus | null {
    if (!blob) return null;
    const raw =
        typeof blob.status === "string"
            ? blob.status
            : typeof blob.statusId === "string"
              ? blob.statusId
              : null;
    if (!raw) return null;
    return raw as IssueStatus;
}

function statusDisplay(status: IssueStatus) {
    return {
        id: status,
        name: issueStatusLabel(status),
        color: null as string | null,
    };
}

export async function getTaskHistoryInOrg(
    orgId: string,
    taskId: string,
    viewerUserId?: string,
): Promise<TaskHistoryItem[]> {
    const task = await prisma.issue.findFirst({
        where: {
            id: taskId,
            workerEngagement: { organizationId: orgId },
        },
        select: { id: true },
    });
    if (!task) {
        throw new Error("Task not found for organization");
    }

    if (viewerUserId) {
        await markIssueMentionsSeen(taskId, viewerUserId);
    }

    const logs = await prisma.issueAuditLog.findMany({
        where: { issueId: taskId },
        orderBy: { createdAt: "desc" },
        include: {
            actorUser: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                },
            },
        },
    });

    const assigneeIds = new Set<string>();
    const engagementIds = new Set<string>();
    for (const log of logs) {
        for (const blob of [log.oldValue, log.newValue]) {
            if (blob && typeof blob === "object" && "workerEngagementId" in blob) {
                const id = (blob as Record<string, unknown>).workerEngagementId;
                if (typeof id === "string") engagementIds.add(id);
            }
            if (blob && typeof blob === "object" && "assigneeUserId" in blob) {
                const id = (blob as Record<string, unknown>).assigneeUserId;
                if (typeof id === "string") assigneeIds.add(id);
            }
        }
    }

    const assignees = assigneeIds.size
        ? await prisma.user.findMany({
              where: { id: { in: Array.from(assigneeIds) } },
              select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
              },
          })
        : [];

    const userById = new Map(assignees.map((u) => [u.id, u]));
    const engagements = engagementIds.size ? await prisma.workerEngagement.findMany({
        where: { id: { in: Array.from(engagementIds) }, organizationId: orgId },
        select: { id: true, type: true, worker: { select: { firstName: true, lastName: true } } },
    }) : [];
    const engagementById = new Map(engagements.map((engagement) => [engagement.id, engagement]));

    const resolvers: ChangeResolvers = {
        engagementName: (id) => {
            const engagement = engagementById.get(id);
            return engagement ? `${engagement.worker.firstName} ${engagement.worker.lastName} · ${engagement.type}` : null;
        },
        userName: (id) => {
            const u = userById.get(id);
            if (!u) return null;
            const name = `${u.firstName} ${u.lastName}`.trim();
            return name || u.email;
        },
    };

    const auditItems: TaskHistoryAuditEntry[] = logs.map((log) => {
        const newObj =
            log.newValue && typeof log.newValue === "object"
                ? (log.newValue as Record<string, unknown>)
                : null;
        const newStatus = readStatusFromAuditBlob(newObj);

        return {
            kind: "audit" as const,
            id: log.id,
            action: log.action,
            createdAt: log.createdAt,
            actorUser: log.actorUser
                ? {
                      id: log.actorUser.id,
                      email: log.actorUser.email,
                      firstName: log.actorUser.firstName,
                      lastName: log.actorUser.lastName,
                      avatarUrl: log.actorUser.avatarUrl,
                  }
                : null,
            status: newStatus ? statusDisplay(newStatus) : null,
            changes: diffAuditValues(log.oldValue, log.newValue, resolvers),
        };
    });

    const comments = await prisma.comment.findMany({
        where: { issueId: taskId },
        orderBy: { createdAt: "asc" },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                },
            },
        },
    });

    const commentItems: TaskHistoryCommentEntry[] = comments.map((c) => ({
        kind: "comment" as const,
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        user: {
            id: c.user.id,
            email: c.user.email,
            firstName: c.user.firstName,
            lastName: c.user.lastName,
            avatarUrl: c.user.avatarUrl,
        },
    }));

    const merged: TaskHistoryItem[] = [...auditItems, ...commentItems];
    merged.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return merged;
}

function tasksPageUrl() {
    const origin = APP_ORIGIN.split(",")[0]?.trim().replace(/\/$/, "") ?? "";
    return `${origin}/tasks`;
}

const commentUserSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
} as const;

export async function upsertIssueCommentInOrg(
    orgId: string,
    userId: string,
    issueId: string,
    payload: { body: string; commentId?: string | null; mentionUserIds?: string[] },
) {
    const body = payload.body.trim();
    if (!body) {
        throw new Error("Comment cannot be empty");
    }

    const issue = await prisma.issue.findFirst({
        where: {
            id: issueId,
            workerEngagement: { organizationId: orgId },
        },
        select: { id: true, title: true, workerEngagementId: true },
    });
    if (!issue) {
        throw new Error("Task not found for organization");
    }

    if (payload.commentId) {
        const existing = await prisma.comment.findFirst({
            where: { id: payload.commentId, issueId },
        });
        if (!existing) {
            throw new Error("Comment not found");
        }
        if (existing.userId !== userId) {
            throw new Error("You can only edit your own comments");
        }
        const comment = await prisma.comment.update({
            where: { id: existing.id },
            data: { body },
            include: { user: { select: commentUserSelect } },
        });
        return { comment, mailFailed: false };
    }

    const mentionIds = [
        ...new Set(
            (payload.mentionUserIds ?? []).filter(
                (id): id is string => typeof id === "string" && id.length > 0 && id !== userId,
            ),
        ),
    ];
    const mentioned =
        mentionIds.length === 0
            ? []
            : await prisma.user.findMany({
                  where: {
                      id: { in: mentionIds },
                      organizationMembers: { some: { organizationId: orgId } },
                  },
                  select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                  },
              });
    if (mentioned.length !== mentionIds.length) {
        throw new AppError(BAD_REQUEST, "Erwähnter Mitarbeiter wurde nicht gefunden");
    }

    const comment = await prisma.comment.create({
        data: { issueId, userId, body, mentionedUserIds: mentionIds },
        include: { user: { select: commentUserSelect } },
    });

    if (mentioned.length === 0) {
        return { comment, mailFailed: false };
    }

    const actor = await prisma.user.findFirst({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
    });
    const senderName =
        `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim() ||
        actor?.email ||
        "Ein Kollege";
    const actionUrl = tasksPageUrl();
    let mailFailed = false;
    await recordIssueMentions(
        issue.id,
        mentioned.map((person) => person.id),
    );

    for (const person of mentioned) {
        const recipientName =
            `${person.firstName} ${person.lastName}`.trim() || person.email;
        const template = getTaskMentionTemplate({
            recipientName,
            senderName,
            sourceTitle: issue.title,
            message: body,
            actionUrl,
        });
        const sent = await sendMail({
            to: person.email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
        if (sent.error) mailFailed = true;
    }

    return { comment, mailFailed };
}
