import { FRONTENDURL } from "@/constants/env";
import { prisma } from "@/lib/prisma";
import { certificateText } from "@/services/arbeitszeugnis";
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
import { getQuestionnaireTemplate } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/sendMail";
import { randomUUID } from "crypto";
import {
    DeleteObjectCommand,
    GetObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Prisma, WorkerStatus, type IssuePriority } from "@prisma/client";
const s3 = new S3Client({ region: process.env.AWS_REGION });
const PRESIGN_EXPIRES = 3600;

async function presign(key: string): Promise<string> {
    const cmd = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
    });
    return getSignedUrl(s3, cmd, { expiresIn: PRESIGN_EXPIRES });
}

async function assertOwnership(workerId: string, organizationId: string) {
    const worker = await prisma.worker.findFirst({
        where: { id: workerId, organizationId },
    });
    if (!worker) throw new Error("Worker not found or access denied");
    return worker;
}

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
        engagementType,
        responsibleUserId,
        startDate,
        endDate,
        templateId,
    } = params;

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
                status: "pending",
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

const EXPECTED_ONBOARDING_TASKS = [
    { title: "Fragebogen", status: "in_progress" },
    { title: "Arbeitsvertrag", status: "open" },
] as const;

function placeholderNamesFromEmail(email: string) {
    const local = (email.split("@")[0] ?? "").split("+")[0];
    const parts = local
        .split(/[._-]+/)
        .map((part) => part.replace(/\d+$/g, "").replace(/[^a-zäöüß]/gi, ""))
        .filter((part) => part.length > 0)
        .map(
            (part) =>
                part.charAt(0).toLocaleUpperCase("de-DE") + part.slice(1),
        );

    return {
        firstName: (parts[0] ?? "Unbekannt").slice(0, 120),
        lastName: parts.slice(1).join(" ").slice(0, 120),
    };
}

export async function startExpectedOnboarding(params: {
    organizationId: string;
    createdByUserId: string;
    email: string;
}) {
    const email = params.email.trim().toLowerCase();
    const { firstName, lastName } = placeholderNamesFromEmail(email);
    const created = await prisma.$transaction(async (tx) => {
        const worker = await tx.worker.create({
            data: {
                organizationId: params.organizationId,
                createdByUserId: params.createdByUserId,
                firstName,
                lastName,
                email,
                status: WorkerStatus.active,
            },
        });

        const engagement = await tx.workerEngagement.create({
            data: {
                workerId: worker.id,
                organizationId: params.organizationId,
                responsibleUserId: params.createdByUserId,
                status: "expected",
                type: "onboarding",
            },
        });

        await tx.issue.createMany({
            data: EXPECTED_ONBOARDING_TASKS.map((task) => ({
                workerEngagementId: engagement.id,
                createdByUserId: params.createdByUserId,
                status: task.status,
                title: task.title,
            })),
        });

        const token = randomUUID();
        await tx.questionnaireSubmission.create({
            data: {
                engagementId: engagement.id,
                status: "sent",
                token,
            },
        });

        const master = await tx.documentMaster.findFirst({
            where: {
                organizationId: params.organizationId,
                kind: "employment_contract",
            },
            orderBy: { updatedAt: "desc" },
        });

        if (master) {
            await tx.employmentContract.create({
                data: {
                    engagementId: engagement.id,
                    masterId: master.id,
                    status: "draft",
                },
            });
        }

        return { worker, engagement, token };
    });

    const formUrl = `${FRONTENDURL.replace(/\/$/, "")}/fragebogen/${created.token}`;
    const template = getQuestionnaireTemplate(formUrl);
    let emailSent = true;
    try {
        const sent = await sendMail({
            to: email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
        emailSent = !sent.error;
    } catch {
        emailSent = false;
    }

    return {
        worker: created.worker,
        engagement: created.engagement,
        emailSent,
    };
}

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
                    responsibleUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    issues: {
                        select: {
                            id: true,
                            status: true,
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

export async function getWorkerById(workerId: string, organizationId: string) {
    const worker = await prisma.worker.findFirst({
        where: { id: workerId, organizationId },
        include: {
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
                    responsibleUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    employmentContract: {
                        select: {
                            id: true,
                            status: true,
                            master: { select: { name: true } },
                        },
                    },
                    arbeitszeugnis: {
                        select: {
                            id: true,
                            sentAt: true,
                            body: true,
                            master: { select: { name: true } },
                        },
                    },
                    issues: {
                        orderBy: { createdAt: "desc" },
                        include: {
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
            workwear: {
                orderBy: { itemName: "asc" },
            },
        },
    });

    if (!worker) return null;

    const documentsWithUrls = await Promise.all(
        worker.documents.map(async (doc) => ({
            ...doc,
            presignedUrl: doc.fileUrl ? await presign(doc.fileUrl) : null,
        })),
    );

    return {
        ...worker,
        documents: documentsWithUrls,
        engagements: worker.engagements.map((engagement) => ({
            ...engagement,
            arbeitszeugnis: engagement.arbeitszeugnis
                ? {
                      id: engagement.arbeitszeugnis.id,
                      sentAt: engagement.arbeitszeugnis.sentAt,
                      name: engagement.arbeitszeugnis.master.name,
                      text: certificateText(engagement.arbeitszeugnis.body),
                  }
                : null,
        })),
    };
}

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

export async function deleteWorker(params: DeleteWorkerInput) {
    const { workerId, organizationId } = params;
    await assertOwnership(workerId, organizationId);

    return withTxRetry(
        async (tx) => {
            await tx.workerDocument.deleteMany({ where: { workerId } });
            await tx.workerEngagement.deleteMany({ where: { workerId } });
            return tx.worker.delete({ where: { id: workerId } });
        },
        {
            maxAttempts: 3,
            baseDelayMs: 1000,
        },
    );
}

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

export async function createEngagement(params: CreateEngagementInput) {
    const {
        workerId,
        organizationId,
        responsibleUserId,
        status,
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
            status: status ?? "pending",
            type,
            startDate,
            endDate,
            completedAt,
        },
        include: {
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

    const data: Prisma.WorkerEngagementUpdateInput = { ...updateData };
    if (
        updateData.status === "completed" &&
        !existing.completedAt &&
        updateData.completedAt === undefined
    ) {
        data.completedAt = new Date();
    }

    return prisma.workerEngagement.update({
        where: { id: engagementId },
        data,
        include: {
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

    return prisma.workerEngagement.delete({ where: { id: engagementId } });
}

export async function createIssue(params: CreateIssueInput) {
    const {
        workerEngagementId,
        createdByUserId,
        status,
        title,
        assigneeUserId,
        templateItemId,
        description,
        priority,
        dueDate,
        automation,
    } = params;

    const engagement = await prisma.workerEngagement.findFirst({
        where: { id: workerEngagementId },
    });
    if (!engagement) throw new Error("WorkerEngagement not found");

    return prisma.$transaction(async (tx) => {
        const issue = await tx.issue.create({
            data: {
                workerEngagementId,
                createdByUserId,
                status: status ?? "open",
                title,
                assigneeUserId,
                templateItemId,
                description,
                priority: priority ?? "no_priority",
                dueDate,
                automation,
            },
            include: {
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
                    status: issue.status,
                },
            },
        });
        return issue;
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
        status,
        priority,
        dueDate,
        automation,
    } = params;

    const existing = await prisma.issue.findFirst({
        where: { id: issueId, workerEngagementId },
    });
    if (!existing) throw new Error("Issue not found");

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (assigneeUserId !== undefined) data.assigneeUserId = assigneeUserId;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate;
    if (automation !== undefined) data.automation = automation;

    const keys = Object.keys(data);
    if (keys.length === 0) {
        return prisma.issue.findFirst({
            where: { id: issueId },
            include: {
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

    const created = [] as { id: string }[];
    for (const item of template.items) {
        const issue = await tx.issue.create({
            data: {
                workerEngagementId,
                createdByUserId: actorUserId,
                assigneeUserId: item.defaultAssigneeUserId ?? undefined,
                status: item.defaultStatus ?? "open",
                title: item.title,
                description: item.description ?? undefined,
                priority: "no_priority",
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
                    status: item.defaultStatus ?? "open",
                    assigneeUserId: item.defaultAssigneeUserId,
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
                responsibleUser: {
                    select: { id: true, firstName: true, lastName: true },
                },
                issues: {
                    orderBy: { createdAt: "desc" },
                    include: {
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
