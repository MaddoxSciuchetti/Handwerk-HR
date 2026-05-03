import { prisma } from "@/lib/prisma";
import type {
    ArchiveWorkerInput,
    CreateAbsenceInput,
    CreateEngagementInput,
    CreateIssueInput,
    CreateWorkerInput,
    DeleteWorkerInput,
    GetWorkersInput,
    UnarchiveWorkerInput,
    UpdateAbsenceInput,
    UpdateDataPointInput,
    UpdateEngagementInput,
    UpdateIssueInput,
    UpdateWorkerInput,
    UploadWorkerDocumentInput,
} from "@/types/worker.types";
import { withTxRetry } from "@/utils/withTxRetry";
import {
    DeleteObjectCommand,
    GetObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Prisma, WorkerStatus, type IssuePriority } from "@prisma/client";
const s3 = new S3Client({ region: process.env.AWS_REGION });
const PRESIGN_EXPIRES = 3600;

// Generate a presigned GET URL from an S3 key
async function presign(key: string): Promise<string> {
    const cmd = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
    });
    return getSignedUrl(s3, cmd, { expiresIn: PRESIGN_EXPIRES });
}

// Scoped ownership guard — throws if worker doesn't belong to org
async function assertOwnership(workerId: string, organizationId: string) {
    const worker = await prisma.worker.findFirst({
        where: { id: workerId, organizationId },
    });
    if (!worker) throw new Error("Worker not found or access denied");
    return worker;
}

// ─── Create Worker ────────────────────────────────────────────────────────────
// Creates Worker + initial WorkerEngagement in one transaction

export async function createWorker(params: CreateWorkerInput) {
    const {
        organizationId,
        createdByUserId,
        firstName,
        lastName,
        email,
        phoneNumber,
        birthday,
        position,
        street,
        city,
        state,
        postalCode,
        country,
        entryDate,
        exitDate,
        // Engagement
        engagementType,
        responsibleUserId,
        startDate,
        endDate,
        // Template (optional)
        templateId,
    } = params;

    const { id: statusId } = await prisma.engagementStatus.findFirstOrThrow({
        where: { organizationId, isDefault: true },
        select: { id: true },
    });

    return prisma.$transaction(async (tx) => {
        const worker = await tx.worker.create({
            data: {
                organizationId,
                createdByUserId,
                firstName,
                lastName,
                email,
                phoneNumber,
                birthday,
                position,
                street,
                city,
                state,
                postalCode,
                country,
                entryDate,
                exitDate,
                status: WorkerStatus.active,
            },
        });

        const engagement = await tx.workerEngagement.create({
            data: {
                workerId: worker.id,
                organizationId,
                responsibleUserId,
                statusId,
                type: engagementType,
                startDate,
                endDate,
            },
        });

        let issuesCreated = 0;
        if (templateId) {
            const result = await applyIssueTemplateInTx(tx, {
                organizationId,
                workerEngagementId: engagement.id,
                templateId,
                actorUserId: createdByUserId,
            });
            issuesCreated = result.count;
        }

        return { worker, engagement, issuesCreated };
    });
}

// ─── Get Workers List ──────────────────────────────────────────────────────────

export async function getWorkerData(params: GetWorkersInput) {
    const {
        organizationId,
        includeArchived = false,
        page = 1,
        limit = 25,
        search,
        status,
    } = params;

    const where = {
        organizationId,
        // If a specific status is requested use it, otherwise active-only unless includeArchived
        ...(status
            ? { status }
            : includeArchived
              ? {}
              : { status: WorkerStatus.active }),
        ...(search
            ? {
                  OR: [
                      {
                          firstName: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                      {
                          lastName: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                      {
                          email: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                  ],
              }
            : {}),
    };

    return prisma.worker.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            engagements: {
                orderBy: { startDate: "desc" },
                take: 1,
                include: {
                    engagementStatus: true,
                    responsibleUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
}

// ─── Get Worker By ID ──────────────────────────────────────────────────────────

export async function getWorkerById(workerId: string, organizationId: string) {
    const worker = await prisma.worker.findFirst({
        where: { id: workerId, organizationId },
        include: {
            // Correct relation names from schema.prisma Worker model:
            // documents  WorkerDocument[]
            // engagements WorkerEngagement[]
            // createdBy   User
            // organization Organization
            documents: {
                orderBy: { createdAt: "desc" },
                include: {
                    uploadedBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
            },
            engagements: {
                orderBy: { startDate: "desc" },
                include: {
                    engagementStatus: true,
                    responsibleUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    // Issues live on WorkerEngagement, not on Worker
                    issues: {
                        orderBy: { createdAt: "desc" },
                        include: {
                            issueStatus: true,
                            assignee: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                            createdBy: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            },
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            organization: {
                select: { id: true, name: true, slug: true },
            },
        },
    });

    if (!worker) return null;

    // Generate presigned URLs for all documents
    // WorkerDocument.fileUrl stores the S3 key or full URL
    const documentsWithUrls = await Promise.all(
        worker.documents.map(async (doc) => ({
            ...doc,
            presignedUrl: doc.fileUrl ? await presign(doc.fileUrl) : null,
        })),
    );

    return { ...worker, documents: documentsWithUrls };
}

// ─── Update Worker ────────────────────────────────────────────────────────────

export async function updateWorker(params: {
    workerId: string;
    organizationId: string;
    updateData: UpdateWorkerInput;
}) {
    const { workerId, organizationId, updateData } = params;
    await assertOwnership(workerId, organizationId);

    return prisma.worker.update({
        where: { id: workerId },
        data: updateData,
    });
}

// ─── Archive Worker ───────────────────────────────────────────────────────────

export async function archiveWorker(params: ArchiveWorkerInput) {
    const { workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);

    return prisma.worker.update({
        where: { id: workerId },
        data: {
            status: WorkerStatus.inactive,
        },
    });
}

// ─── Unarchive Worker ──────────────────────────────────────────────────────────

export async function unarchiveWorker(params: UnarchiveWorkerInput) {
    const { workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);

    return prisma.worker.update({
        where: { id: workerId },
        data: {
            status: WorkerStatus.active,
        },
    });
}

// ─── Delete Worker ────────────────────────────────────────────────────────────
// Cascade order: Issues (via engagement cascade) → Documents → Engagements → Worker
// Note: Issue.onDelete=Cascade on WorkerEngagement means deleting engagements
// auto-deletes issues. We still delete documents explicitly.

export async function deleteWorker(params: DeleteWorkerInput) {
    const { workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);

    return withTxRetry(async (tx) => {
        await tx.workerDocument.deleteMany({ where: { workerId } });
        await tx.workerEngagement.deleteMany({ where: { workerId } });
        return tx.worker.delete({ where: { id: workerId } });
    });
}

// ─── Update Data Point ──────────────────────────────────────────────────────────
// Patches one Worker column, or `responsibleUserId` on the latest engagement.

const WORKER_DATE_FIELDS = new Set(["birthday", "entryDate", "exitDate"]);

function coerceWorkerDataPointValue(
    field: string,
    value: string | number | boolean | Date | null,
): string | number | boolean | Date | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value;
    if (WORKER_DATE_FIELDS.has(field) && typeof value === "string") {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? value : d;
    }
    return value;
}

export async function updateDataPoint(params: UpdateDataPointInput) {
    const { workerId, organizationId, field, value } = params;
    await assertOwnership(workerId, organizationId);

    if (field === "responsibleUserId") {
        const engagement = await prisma.workerEngagement.findFirst({
            where: { workerId },
            orderBy: { startDate: "desc" },
        });
        if (!engagement) {
            throw new Error("Kein Engagement für diesen Handwerker gefunden");
        }
        return prisma.workerEngagement.update({
            where: { id: engagement.id },
            data: { responsibleUserId: String(value) },
        });
    }

    const coerced = coerceWorkerDataPointValue(field, value);

    return prisma.worker.update({
        where: { id: workerId },
        data: { [field]: coerced } as Prisma.WorkerUpdateInput,
    });
}

// ─── Engagements ───────────────────────────────────────────────────────────────

export async function createEngagement(params: CreateEngagementInput) {
    const {
        workerId,
        organizationId,
        responsibleUserId,
        statusId,
        type,
        startDate,
        endDate,
        completedAt,
    } = params;
    await assertOwnership(workerId, organizationId);

    return prisma.workerEngagement.create({
        data: {
            workerId,
            organizationId,
            responsibleUserId,
            statusId,
            type,
            startDate,
            endDate,
            completedAt,
        },
        include: {
            engagementStatus: true,
            responsibleUser: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });
}

export async function updateEngagement(params: UpdateEngagementInput) {
    const { engagementId, workerId, organizationId, ...updateData } = params;
    await assertOwnership(workerId, organizationId);

    const existing = await prisma.workerEngagement.findFirst({
        where: { id: engagementId, workerId },
    });
    if (!existing) throw new Error("Engagement not found");

    return prisma.workerEngagement.update({
        where: { id: engagementId },
        data: updateData,
        include: {
            engagementStatus: true,
            responsibleUser: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });
}

export async function deleteEngagement(params: {
    engagementId: string;
    workerId: string;
    organizationId: string;
}) {
    const { engagementId, workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);

    // Cascade on WorkerEngagement will delete Issues and related records
    return prisma.workerEngagement.delete({ where: { id: engagementId } });
}

// ─── Issues ────────────────────────────────────────────────────────────────────
// Issues belong to WorkerEngagement via workerEngagementId, NOT directly to Worker

export async function createIssue(params: CreateIssueInput) {
    const {
        workerEngagementId,
        createdByUserId,
        statusId,
        title,
        assigneeUserId,
        templateItemId,
        description,
        priority,
        dueDate,
    } = params;

    // Verify the engagement exists (no direct workerId on Issue)
    const engagement = await prisma.workerEngagement.findFirst({
        where: { id: workerEngagementId },
    });
    if (!engagement) throw new Error("WorkerEngagement not found");

    return prisma.$transaction(async (tx) => {
        const issue = await tx.issue.create({
            data: {
                workerEngagementId,
                createdByUserId,
                statusId,
                title,
                assigneeUserId,
                templateItemId,
                description,
                priority: priority ?? "no_priority",
                dueDate,
            },
            include: {
                issueStatus: true,
                assignee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                templateItem: true,
            },
        });
        await tx.issueAuditLog.create({
            data: {
                issueId: issue.id,
                actorUserId: createdByUserId,
                action: "issue.created",
                newValue: {
                    title: issue.title,
                    statusId: issue.statusId,
                },
            },
        });
        return issue;
    });
}

export async function getIssueStatusesForWorker(params: {
    workerId: string;
    organizationId: string;
}) {
    const { workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);
    return prisma.issueStatus.findMany({
        where: { organizationId },
        orderBy: { orderIndex: "asc" },
        select: { id: true, name: true },
    });
}

export async function updateIssue(params: UpdateIssueInput) {
    const {
        issueId,
        workerEngagementId,
        actorUserId,
        title,
        description,
        assigneeUserId,
        statusId,
        priority,
        dueDate,
    } = params;

    const existing = await prisma.issue.findFirst({
        where: { id: issueId, workerEngagementId },
    });
    if (!existing) throw new Error("Issue not found");

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (assigneeUserId !== undefined) data.assigneeUserId = assigneeUserId;
    if (statusId !== undefined) data.statusId = statusId;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate;

    const keys = Object.keys(data);
    if (keys.length === 0) {
        return prisma.issue.findFirst({
            where: { id: issueId },
            include: {
                issueStatus: true,
                assignee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    const oldValue: Record<string, unknown> = {};
    for (const k of keys) {
        oldValue[k] = (existing as unknown as Record<string, unknown>)[k];
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.issue.update({
            where: { id: issueId },
            data,
            include: {
                issueStatus: true,
                assignee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        const newValue: Record<string, unknown> = {};
        for (const k of keys) {
            newValue[k] = (updated as unknown as Record<string, unknown>)[k];
        }
        await tx.issueAuditLog.create({
            data: {
                issueId,
                actorUserId,
                action: "issue.updated",
                oldValue: oldValue as Prisma.InputJsonValue,
                newValue: newValue as Prisma.InputJsonValue,
            },
        });
        return updated;
    });
}

export async function getIssueAuditLogs(params: {
    workerId: string;
    issueId: string;
    organizationId: string;
}) {
    const { workerId, issueId, organizationId } = params;
    await assertOwnership(workerId, organizationId);
    const issue = await prisma.issue.findFirst({
        where: {
            id: issueId,
            workerEngagement: { workerId },
        },
        select: { id: true },
    });
    if (!issue) throw new Error("Issue not found");

    return prisma.issueAuditLog.findMany({
        where: { issueId },
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
}

function templatePriorityToIssuePriority(
    p: IssuePriority | null,
): IssuePriority {
    if (!p) return "no_priority";
    return p;
}

// Core template-application logic, parameterized over a Prisma transaction
// client so it can run either inside an existing $transaction (e.g. createWorker)
// or wrapped in its own transaction by the public API.
async function applyIssueTemplateInTx(
    tx: Prisma.TransactionClient,
    params: {
        organizationId: string;
        workerEngagementId: string;
        templateId: string;
        actorUserId: string;
    },
) {
    const { organizationId, workerEngagementId, templateId, actorUserId } =
        params;

    const template = await tx.issueTemplate.findFirst({
        where: { id: templateId, organizationId },
        include: {
            items: { orderBy: { orderIndex: "asc" } },
        },
    });
    if (!template) throw new Error("Template not found");

    const statuses = await tx.issueStatus.findMany({
        where: { organizationId },
        orderBy: { orderIndex: "asc" },
    });
    const byName = (n: string) => statuses.find((s) => s.name === n)?.id;
    const initialStatusId =
        statuses.find((s) => s.isDefault)?.id ??
        byName("Offen") ??
        statuses[0]?.id;
    if (!initialStatusId) throw new Error("No issue statuses configured");

    const created = [] as { id: string }[];
    for (const item of template.items) {
        const issue = await tx.issue.create({
            data: {
                workerEngagementId,
                createdByUserId: actorUserId,
                statusId: initialStatusId,
                title: item.title,
                description: item.description ?? undefined,
                priority: templatePriorityToIssuePriority(item.defaultPriority),
                templateItemId: item.id,
            },
            select: { id: true },
        });
        await tx.issueAuditLog.create({
            data: {
                issueId: issue.id,
                actorUserId,
                action: "issue.created",
                newValue: {
                    title: item.title,
                    statusId: initialStatusId,
                    templateItemId: item.id,
                },
            },
        });
        created.push(issue);
    }

    return { count: created.length, issueIds: created.map((c) => c.id) };
}

export async function applyIssueTemplate(params: {
    workerId: string;
    organizationId: string;
    workerEngagementId: string;
    templateId: string;
    actorUserId: string;
}) {
    const {
        workerId,
        organizationId,
        workerEngagementId,
        templateId,
        actorUserId,
    } = params;

    await assertOwnership(workerId, organizationId);

    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: workerEngagementId,
            workerId,
            organizationId,
        },
        select: { id: true },
    });
    if (!engagement) throw new Error("Worker engagement not found");

    return prisma.$transaction((tx) =>
        applyIssueTemplateInTx(tx, {
            organizationId,
            workerEngagementId: engagement.id,
            templateId,
            actorUserId,
        }),
    );
}

export async function deleteIssue(params: {
    issueId: string;
    workerEngagementId: string;
}) {
    const { issueId, workerEngagementId } = params;

    const existing = await prisma.issue.findFirst({
        where: { id: issueId, workerEngagementId },
    });
    if (!existing) throw new Error("Issue not found");

    return prisma.issue.delete({ where: { id: issueId } });
}

// ─── Absences ─────────────────────────────────────────────────────────────────
// Absence belongs to User (userId) + Organization (orgId) — NOT Worker directly

export async function createAbsence(params: CreateAbsenceInput) {
    const { userId, orgId, absenceType, startDate, endDate, substituteId } =
        params;

    return prisma.absence.create({
        data: {
            userId,
            orgId,
            absenceType,
            startDate,
            endDate,
            substituteId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            substitute: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });
}

export async function updateAbsence(params: UpdateAbsenceInput) {
    const { absenceId, ...updateData } = params;

    const existing = await prisma.absence.findFirst({
        where: { id: absenceId },
    });
    if (!existing) throw new Error("Absence not found");

    return prisma.absence.update({
        where: { id: absenceId },
        data: updateData,
        include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            substitute: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });
}

export async function deleteAbsence(params: { absenceId: string }) {
    const { absenceId } = params;
    return prisma.absence.delete({ where: { id: absenceId } });
}

// ─── Worker Documents ──────────────────────────────────────────────────────────
// Model: WorkerDocument — fields: fileUrl, uploadedByUserId, fileSizeBytes, mimeType
// NO WorkerFile model, NO cloud_key field

export async function uploadWorkerDocument(params: UploadWorkerDocumentInput) {
    const {
        workerId,
        organizationId,
        uploadedByUserId,
        name,
        fileUrl,
        fileType,
        fileSizeBytes,
        mimeType,
    } = params;

    await assertOwnership(workerId, organizationId);

    const doc = await prisma.workerDocument.create({
        data: {
            workerId,
            uploadedByUserId,
            name,
            fileUrl,
            fileType,
            fileSizeBytes,
            mimeType,
        },
        include: {
            uploadedBy: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });

    // Return with presigned URL
    return { ...doc, presignedUrl: await presign(fileUrl) };
}

export async function deleteWorkerDocument(params: {
    documentId: string;
    workerId: string;
    organizationId: string;
}) {
    const { documentId, workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);

    const doc = await prisma.workerDocument.findFirst({
        where: { id: documentId, workerId },
    });
    if (!doc) throw new Error("Document not found");

    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: doc.fileUrl,
            }),
        );
    } catch (error) {
        console.error("S3 delete failed for key", doc.fileUrl, error);
    }

    return prisma.workerDocument.delete({ where: { id: documentId } });
}

export async function listWorkerDocuments(params: {
    workerId: string;
    organizationId: string;
}) {
    const { workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);

    const docs = await prisma.workerDocument.findMany({
        where: { workerId },
        orderBy: { createdAt: "desc" },
    });

    return Promise.all(
        docs.map(async (doc) => ({
            ...doc,
            presignedUrl: await presign(doc.fileUrl),
        })),
    );
}

// ─── Worker History ───────────────────────────────────────────────────────────
// Engagements with issues + standalone documents

export async function getWorkerHistory(params: {
    workerId: string;
    organizationId: string;
}) {
    const { workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);

    const [engagements, documents] = await Promise.all([
        prisma.workerEngagement.findMany({
            where: { workerId },
            orderBy: { startDate: "desc" },
            include: {
                engagementStatus: true,
                responsibleUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
                issues: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        issueStatus: true,
                        assignee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.workerDocument.findMany({
            where: { workerId },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return { engagements, documents };
}
