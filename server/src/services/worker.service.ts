import { isDeactivation, lockDeactivation } from "./integrations/deactivationSchedule";
import z from "zod";
import {
    freezePrintedContract,
    unfreezePrintedContract,
} from "@/services/employmentContract.service";
import { integrationsMocked } from "./integrations/localMock";
import { applyTemplateApplication, type TemplateApplyInput } from './templateApplication';

import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";
import { questionnaireSender } from "@/services/questionnaireSender";
import { prisma } from "@/lib/prisma";
import { templateItemsForEngagement } from "@/services/onboardingTemplateTasks";
import { fillWorkerProfileFromQuestionnaires } from "@/services/questionnaireWorkerProfile";
import { certificateText } from "@/services/arbeitszeugnis";
import { issueVisibleToViewer } from "@/services/issueVisibility";
import {
    attachMentionFlag,
    unreadMentionInclude,
} from "@/services/issueMentions";
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

function namesFromDisplayName(name: string) {
    const parts = name
        .trim()
        .split(/\s+/)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

    return {
        firstName: (parts[0] ?? "Unbekannt").slice(0, 120),
        lastName: parts.slice(1).join(" ").slice(0, 120),
    };
}

export async function startExpectedOnboarding(params: {
    organizationId: string;
    createdByUserId: string;
    email?: string;
    name?: string;
}) {
    const senderAddress = await questionnaireSender(params.createdByUserId);
    const email = params.email?.trim().toLowerCase() || null;
    const { firstName, lastName } = email
        ? placeholderNamesFromEmail(email)
        : namesFromDisplayName(params.name ?? "");
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
                status: "pending",
                type: "onboarding",
                questionnaireSenderAddress: senderAddress,
            },
        });

        return { worker, engagement };
    });

    return {
        worker: created.worker,
        engagement: created.engagement,
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
        viewerUserId,
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

    if (params.summary) {
        const workers = await prisma.worker.findMany({
            where,
            orderBy: { createdAt: "desc" },
            select: {
                id: true, firstName: true, lastName: true, email: true,
                position: true, status: true, birthday: true, entryDate: true,
                exitDate: true, createdAt: true, updatedAt: true,
                engagements: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true, type: true, status: true, startedAt: true,
                        completedAt: true, startDate: true, endDate: true,
                        responsibleUser: { select: { id: true, firstName: true, lastName: true, email: true } },
                        templateApplication: { select: { id: true, completedAt: true, resultsDismissedAt: true } },
                        questionnaireSubmission: { select: { id: true, status: true, completedAt: true } },
                    },
                },
            },
        });
        const engagementIds = workers.flatMap(worker => worker.engagements.map(engagement => engagement.id));
        const [counts, allCounts] = engagementIds.length ? await Promise.all([prisma.issue.groupBy({
            by: ["workerEngagementId", "status"],
            where: { workerEngagementId: { in: engagementIds }, ...issueVisibleToViewer(viewerUserId) },
            _count: { _all: true },
        }), prisma.issue.groupBy({
            by: ["workerEngagementId", "status"],
            where: { workerEngagementId: { in: engagementIds } },
            _count: { _all: true },
        })]) : [[], []];
        const byEngagement = new Map<string, { status: string; count: number }[]>();
        for (const row of counts) {
            if (!row.workerEngagementId) continue;
            const values = byEngagement.get(row.workerEngagementId) ?? [];
            values.push({ status: row.status, count: row._count._all });
            byEngagement.set(row.workerEngagementId, values);
        }
        // The list totals tasks across the current phase, including older records
        // left behind by type switches. Its completion icon must use that scope too.
        // Use all tasks for completion so private open tasks cannot be overlooked.
        const allByEngagement = new Map<string, { total: number; open: number }>();
        for (const row of allCounts) {
            if (!row.workerEngagementId) continue;
            const value = allByEngagement.get(row.workerEngagementId) ?? { total: 0, open: 0 };
            value.total += row._count._all;
            if (!["done", "cancelled", "not_applicable"].includes(row.status)) {
                value.open += row._count._all;
            }
            allByEngagement.set(row.workerEngagementId, value);
        }
        return workers.map(worker => {
            const phases = new Map<string, { total: number; open: number }>();
            for (const engagement of worker.engagements) {
                const phase = phases.get(engagement.type) ?? { total: 0, open: 0 };
                const tasks = allByEngagement.get(engagement.id);
                phase.total += tasks?.total ?? 0;
                phase.open += tasks?.open ?? 0;
                phases.set(engagement.type, phase);
            }
            return { ...worker, engagements: worker.engagements.map(engagement => {
                const phase = phases.get(engagement.type)!;
                return {
                    ...engagement,
                    issueCounts: byEngagement.get(engagement.id) ?? [],
                    taskPhaseCompleted: phase.total > 0 && phase.open === 0,
                };
            }) };
        });
    }

    return prisma.worker.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            engagements: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                    templateApplication: { select: { id: true, completedAt: true, resultsDismissedAt: true } },
                    questionnaireSubmission: { select: { id: true, status: true, completedAt: true } },
                    responsibleUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    issues: {
                        where: issueVisibleToViewer(viewerUserId),
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

export async function getWorkerById(
    workerId: string,
    organizationId: string,
    viewerUserId: string,
) {
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
                orderBy: { createdAt: "desc" },
                include: {
                    templateApplication: { select: { id: true, completedAt: true, resultsDismissedAt: true } },
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
                    questionnaireSubmission: {
                        select: {
                            id: true,
                            status: true,
                            completedAt: true,
                            formDefinition: true,
                            answers: { select: { key: true, value: true } },
                        },
                    },
                    issues: {
                        where: issueVisibleToViewer(viewerUserId),
                        // Keep tasks created together in the same order after edits.
                        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
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
                            mentions: unreadMentionInclude(viewerUserId),
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

    const profile = fillWorkerProfileFromQuestionnaires(
        worker,
        worker.engagements.flatMap((engagement) =>
            engagement.questionnaireSubmission
                ? [engagement.questionnaireSubmission]
                : [],
        ),
    );

    const documentsWithUrls = await Promise.all(
        worker.documents.map(async (doc) => ({
            ...doc,
            presignedUrl: doc.fileUrl ? await presign(doc.fileUrl) : null,
        })),
    );

    return {
        ...profile,
        documents: documentsWithUrls,
        engagements: worker.engagements.map((engagement) => ({
            ...engagement,
            issues: (engagement.issues ?? []).map(attachMentionFlag),
            questionnaireSubmission: engagement.questionnaireSubmission
                ? {
                      id: engagement.questionnaireSubmission.id,
                      status: engagement.questionnaireSubmission.status,
                      completedAt: engagement.questionnaireSubmission.completedAt,
                      name: questionnaireName(engagement.questionnaireSubmission.formDefinition),
                  }
                : null,
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

function questionnaireName(definition: unknown): string {
    return definition && typeof definition === "object" &&
        "name" in definition && typeof definition.name === "string"
        ? definition.name
        : "Personalfragebogen";
}

export async function updateWorker(params: {
    workerId: string;
    organizationId: string;
    updateData: UpdateWorkerInput;
}) {
    const { workerId, organizationId, updateData } = params;
    await assertOwnership(workerId, organizationId);

    const { workwearSize, ...workerData } = updateData;
    if (!workwearSize) {
        return prisma.worker.update({
            where: { id: workerId },
            data: workerData,
        });
    }

    const sizeEdit = z.object({
        itemName: z.enum(["Hose", "T-Shirt"]),
        size: z.string().trim().max(32),
    }).parse(workwearSize);

    return prisma.$transaction(async (tx) => {
        const existing = await tx.workerWorkwear.findFirst({
            where: { workerId, itemName: sizeEdit.itemName },
        });
        if (existing) {
            await tx.workerWorkwear.updateMany({
                where: { workerId, itemName: sizeEdit.itemName },
                data: { size: sizeEdit.size },
            });
        } else if (sizeEdit.size) {
            await tx.workerWorkwear.create({
                data: {
                    workerId,
                    itemName: sizeEdit.itemName,
                    size: sizeEdit.size,
                    articleNumber: "",
                    quantity: 1,
                },
            });
        }
        return tx.worker.update({
            where: { id: workerId },
            data: workerData,
        });
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

export async function deleteWorkers(params: { organizationId: string; workerIds: string[] }) {
    const { organizationId } = params;
    const workerIds = [...new Set(params.workerIds)];
    if (!workerIds.length) return { count: 0 };

    return withTxRetry(async (tx) => {
        const owned = await tx.worker.findMany({
            where: { id: { in: workerIds }, organizationId },
            select: { id: true },
        });
        if (owned.length !== workerIds.length) {
            throw new Error("Worker not found or access denied");
        }
        // Child relations use ON DELETE CASCADE, so one scoped delete also
        // removes engagements, issues and documents within this transaction.
        return tx.worker.deleteMany({
            where: { id: { in: workerIds }, organizationId },
        });
    });
}

export async function deleteWorker(params: DeleteWorkerInput) {
    await deleteWorkers({ organizationId: params.organizationId, workerIds: [params.workerId] });
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
            orderBy: { createdAt: "desc" },
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

    // Offboarding has its own tasks and template receipt; retain onboarding history.
    if (updateData.type === "offboarding" && existing.type !== "offboarding") {
        const offboarding = await prisma.workerEngagement.findFirst({
            where: { workerId, organizationId, type: "offboarding" },
            orderBy: { createdAt: "desc" },
        });
        // A retry can reuse the phase created by the first request. Returning
        // to offboarding after a newer Team phase needs a new active phase.
        if (offboarding && offboarding.createdAt >= existing.createdAt) return offboarding;
        return createEngagement({
            workerId,
            organizationId,
            responsibleUserId: updateData.responsibleUserId ?? existing.responsibleUserId,
            type: "offboarding",
            status: updateData.status ?? "pending",
            startDate: updateData.startDate,
            endDate: updateData.endDate,
            completedAt: updateData.completedAt,
        });
    }

    // Never relabel onboarding/offboarding in place — Team and returns to a
    // lifecycle type are new phases so tasks and template receipts stay put.
    // The newest engagement determines the worker's current lifecycle phase.
    if (updateData.type && updateData.type !== existing.type) {
        const latest = await prisma.workerEngagement.findFirst({
            where: { workerId, organizationId },
            orderBy: { createdAt: "desc" },
        });
        if (latest && latest.id !== existing.id && latest.type === updateData.type) return latest;
        return createEngagement({
            workerId,
            organizationId,
            responsibleUserId: updateData.responsibleUserId ?? existing.responsibleUserId,
            type: updateData.type,
            status: updateData.status ?? (updateData.type === "transfer" ? "completed" : "pending"),
            startDate: updateData.startDate,
            endDate: updateData.endDate,
            completedAt: updateData.completedAt ?? (updateData.type === "transfer" ? new Date() : undefined),
        });
    }

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
        organizationId,
        createdByUserId,
        status,
        title,
        assigneeUserId,
        templateItemId,
        description,
        priority,
        dueDate,
        automation,
        integrationProvider,
        sequence,
        mailTemplateId,
        mailSenderAddress,
        microsoftAccountId,
        assigneeOnly,
    } = params;

    if (!workerEngagementId && !organizationId) {
        throw new Error("WorkerEngagement not found");
    }

    if (workerEngagementId) {
        const engagement = await prisma.workerEngagement.findFirst({
            where: { id: workerEngagementId },
        });
        if (!engagement) throw new Error("WorkerEngagement not found");
    }

    return prisma.$transaction(async (tx) => {
        const issue = await tx.issue.create({
            data: {
                workerEngagementId,
                organizationId,
                createdByUserId,
                status: status ?? "open",
                title,
                assigneeUserId,
                templateItemId,
                description,
                priority: priority ?? "no_priority",
                dueDate,
                automation,
                integrationProvider,
                sequence,
                mailTemplateId,
                mailSenderAddress,
                microsoftAccountId,
                assigneeOnly: assigneeOnly ?? false,
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
        newWorkerEngagementId,
        actorUserId,
        title,
        description,
        assigneeUserId,
        status,
        priority,
        dueDate,
        automation,
        integrationProvider,
        sequence,
        mailTemplateId,
        mailSenderAddress,
        microsoftAccountId,
    } = params;

    const existing = await prisma.issue.findFirst({
        where: { id: issueId, workerEngagementId },
    });
    if (!existing) throw new Error("Issue not found");

    const data: Record<string, unknown> = {};
    if (newWorkerEngagementId !== undefined) data.workerEngagementId = newWorkerEngagementId;
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (assigneeUserId !== undefined) data.assigneeUserId = assigneeUserId;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate;
    if (automation !== undefined) data.automation = automation;
    if (integrationProvider !== undefined) data.integrationProvider = integrationProvider;
    if (sequence !== undefined) data.sequence = sequence;
    if (mailTemplateId !== undefined) data.mailTemplateId = mailTemplateId;
    if (mailSenderAddress !== undefined) data.mailSenderAddress = mailSenderAddress;
    if (microsoftAccountId !== undefined) data.microsoftAccountId = microsoftAccountId;

    const keys = Object.keys(data).filter((key) => {
        const previous = (existing as unknown as Record<string, unknown>)[key];
        if (JSON.stringify(previous) === JSON.stringify(data[key])) {
            delete data[key];
            return false;
        }
        return true;
    });
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
        if (existing.kind === "contract_send") {
            const engagementId = newWorkerEngagementId ?? workerEngagementId;
            if (status === "done" && existing.status !== "done") {
                await freezePrintedContract(tx, engagementId);
            } else if (
                existing.status === "done" &&
                status !== undefined &&
                status !== "done"
            ) {
                await unfreezePrintedContract(tx, engagementId);
            }
        }
        if (isDeactivation(existing.sequence) || existing.scheduledDeactivateAt) {
            await lockDeactivation(tx, issueId);
            const current = await tx.issue.findFirst({ where: { id: issueId, workerEngagementId } });
            if (current?.deactivationClaimUntil && current.deactivationClaimUntil > new Date())
                throw new AppError(409, "Die Deaktivierung läuft bereits.");
            if ((sequence !== undefined && sequence !== current?.sequence) ||
                (newWorkerEngagementId !== undefined && newWorkerEngagementId !== current?.workerEngagementId)) {
                data.scheduledDeactivateAt = null;
                data.scheduledDeactivateByUserId = null;
                oldValue.scheduledDeactivateAt = current?.scheduledDeactivateAt?.toISOString().slice(0, 10) ?? null;
                keys.push("scheduledDeactivateAt");
            }
        }
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
        remainingOnly?: boolean;
        runAutomation?: boolean;
        templateSnapshot?: Prisma.IssueTemplateGetPayload<{ include: { items: true } }>;
    },
) {
    const {
        organizationId,
        workerEngagementId,
        templateId,
        actorUserId,
        remainingOnly = false,
    } = params;

    const template = params.templateSnapshot ?? await tx.issueTemplate.findFirst({
        where: { id: templateId, organizationId },
        include: {
            items: { orderBy: { orderIndex: "asc" } },
        },
    });
    if (!template) throw new Error("Template not found");

    const existing = remainingOnly
        ? await tx.issue.findMany({
              where: {
                  workerEngagementId,
                  templateItemId: { not: null },
              },
              select: { templateItemId: true },
          })
        : [];
    const items = templateItemsForEngagement(template.items, {
        remainingOnly,
        existingTemplateItemIds: existing.flatMap((issue) =>
            issue.templateItemId ? [issue.templateItemId] : [],
        ),
    });

    const created = [] as { id: string }[];
    for (const item of items) {
        const issue = await tx.issue.create({
            data: {
                workerEngagementId,
                createdByUserId: actorUserId,
                assigneeUserId: item.defaultAssigneeUserId ?? undefined,
                status: params.runAutomation && item.sequence ? "open" : item.defaultStatus ?? "open",
                title: item.title,
                description: item.description ?? undefined,
                priority: "no_priority",
                templateItemId: item.id,
                integrationProvider: item.integrationProvider,
                sequence: item.sequence,
                mailTemplateId: item.mailTemplateId,
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
                    status: params.runAutomation && item.sequence ? "open" : item.defaultStatus ?? "open",
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
    runAutomation?: boolean;
    choices?: TemplateApplyInput["choices"];
    idempotencyKey?: string;
    templateRevision?: string;
    workerId: string;
    organizationId: string;
    workerEngagementId: string;
    templateId: string;
    actorUserId: string;
    remainingOnly?: boolean;
}) {
    const {
        workerId,
        organizationId,
        workerEngagementId,
        templateId,
        actorUserId,
        remainingOnly = false,
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

    return applyTemplateApplication({ workerId, organizationId, templateId, actorUserId }, {
        workerEngagementId, runAutomation: params.runAutomation ?? false,
        choices: params.choices ?? {}, idempotencyKey: params.idempotencyKey,
        templateRevision: params.templateRevision,
    }, (tx, templateSnapshot) => applyIssueTemplateInTx(tx, {
            templateSnapshot,
            runAutomation: params.runAutomation,
            organizationId,
            workerEngagementId: engagement.id,
            templateId,
            actorUserId,
            remainingOnly: integrationsMocked() ? false : remainingOnly,
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
    viewerUserId: string;
}) {
    const { workerId, organizationId, viewerUserId } = params;
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
                    where: issueVisibleToViewer(viewerUserId),
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
