import { CONFLICT, NOT_FOUND } from "@/constants/http";
import { USE_MICROSOFT_MAIL } from "@/constants/env";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3 } from "@/config/aws";
import resend from "@/config/resend";
import {
    downloadReplyPdf,
    findInboxReply,
    graphMailConfigured,
} from "@/services/graphMail";
import { isQuestionnaireOrContractTemplateTask } from "@/services/onboardingTemplateTasks";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";

const CONFIRM_TASK_TITLE = "Arbeitsvertrag bestätigen";
const POLL_MS = 60_000;
const RESEND_MATCH = "resend:";

async function storeSignedPdf(params: {
    contractId: string;
    workerId: string;
    uploadedByUserId: string;
    pdf: { name: string; bytes: Buffer };
}) {
    const pdf = params.pdf;

    const uploaded = await uploadFileToS3(
        {
            buffer: pdf.bytes,
            mimetype: "application/pdf",
        } as Express.Multer.File,
        params.contractId,
        "upload/contracts",
    );
    if (!uploaded.success || !uploaded.key) return;

    await prisma.$transaction(async (tx) => {
        await tx.employmentContract.update({
            where: { id: params.contractId },
            data: { fileUrl: uploaded.key },
        });
        await tx.workerDocument.create({
            data: {
                workerId: params.workerId,
                uploadedByUserId: params.uploadedByUserId,
                name: pdf.name,
                fileUrl: uploaded.key,
                fileType: "contract",
                mimeType: "application/pdf",
                fileSizeBytes: pdf.bytes.length,
            },
        });
    });
}

async function openConfirmTask(engagementId: string, actorUserId: string) {
    await prisma.$transaction(async (tx) => {
        const existing = await tx.issue.findFirst({
            where: { workerEngagementId: engagementId, kind: "contract_confirm" },
            select: { id: true },
        });
        if (existing) return;

        await tx.issue.create({
            data: {
                workerEngagementId: engagementId,
                createdByUserId: actorUserId,
                assigneeUserId: actorUserId,
                status: "in_progress",
                kind: "contract_confirm",
                isTemporary: true,
                title: CONFIRM_TASK_TITLE,
            },
        });
    });
}

const CONTRACT_TOKEN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function contractTokenFromSubject(subject: string) {
    return subject.match(CONTRACT_TOKEN)?.[0] ?? null;
}

export async function ingestResendContractReply(params: {
    subject: string;
    emailId: string;
}) {
    const token = contractTokenFromSubject(params.subject);
    if (!token) return;

    const contract = await prisma.employmentContract.findFirst({
        where: {
            conversationId: `${RESEND_MATCH}${token}`,
            confirmedAt: null,
            status: "ready",
        },
        select: {
            id: true,
            fileUrl: true,
            engagement: {
                select: {
                    id: true,
                    workerId: true,
                    responsibleUserId: true,
                    issues: {
                        where: { kind: "contract_confirm" },
                        select: { id: true },
                        take: 1,
                    },
                },
            },
        },
    });
    if (!contract || contract.engagement.issues.length > 0) return;

    if (!contract.fileUrl) {
        try {
            const pdf = await downloadResendPdf(params.emailId);
            if (pdf) {
                await storeSignedPdf({
                    contractId: contract.id,
                    workerId: contract.engagement.workerId,
                    uploadedByUserId: contract.engagement.responsibleUserId,
                    pdf,
                });
            }
        } catch (error) {
            console.error(
                "Signed contract PDF could not be stored",
                contract.id,
                error,
            );
        }
    }

    await openConfirmTask(
        contract.engagement.id,
        contract.engagement.responsibleUserId,
    );
}

async function downloadResendPdf(emailId: string) {
    const listed = await resend.emails.receiving.attachments.list({ emailId });
    if (listed.error || !listed.data) return null;
    const pdf = listed.data.data.find((attachment) => {
        const name = attachment.filename?.toLowerCase() ?? "";
        return (
            attachment.content_type === "application/pdf" || name.endsWith(".pdf")
        );
    });
    if (!pdf?.download_url) return null;
    const response = await fetch(pdf.download_url);
    if (!response.ok) return null;
    return {
        name: pdf.filename || "Arbeitsvertrag.pdf",
        bytes: Buffer.from(await response.arrayBuffer()),
    };
}

export async function pollReturnedContracts() {
    if (!USE_MICROSOFT_MAIL || !graphMailConfigured()) return;

    const waiting = await prisma.employmentContract.findMany({
        where: {
            conversationId: { not: null },
            confirmedAt: null,
            sentAt: { not: null },
            status: "ready",
        },
        select: {
            id: true,
            conversationId: true,
            fileUrl: true,
            engagement: {
                select: {
                    id: true,
                    workerId: true,
                    responsibleUserId: true,
                    issues: {
                        where: { kind: "contract_confirm" },
                        select: { id: true },
                        take: 1,
                    },
                },
            },
        },
    });

    for (const contract of waiting) {
        if (contract.engagement.issues.length > 0) continue;
        if (!contract.conversationId) continue;

        try {
            const reply = await findReturnedMessage(contract.conversationId);
            if (!reply) continue;

            if (!contract.fileUrl && reply.pdf) {
                try {
                    await storeSignedPdf({
                        contractId: contract.id,
                        workerId: contract.engagement.workerId,
                        uploadedByUserId: contract.engagement.responsibleUserId,
                        pdf: reply.pdf,
                    });
                } catch (error) {
                    console.error(
                        "Signed contract PDF could not be stored",
                        contract.id,
                        error,
                    );
                }
            }

            await openConfirmTask(
                contract.engagement.id,
                contract.engagement.responsibleUserId,
            );
        } catch (error) {
            console.error(
                "Returned contract could not be matched",
                contract.id,
                error,
            );
        }
    }
}

async function findReturnedMessage(conversationId: string) {
    if (conversationId.startsWith(RESEND_MATCH)) return null;
    const reply = await findInboxReply(conversationId);
    if (!reply) return null;
    const pdf = await downloadReplyPdf(reply.id);
    return { id: reply.id, pdf };
}

export function startReturnedContractPolling() {
    if (!USE_MICROSOFT_MAIL) {
        console.log(
            "Returned contracts are received at POST /webhooks/resend.",
        );
        return;
    }
    if (!graphMailConfigured()) {
        console.log(
            "USE_MICROSOFT_MAIL is on, but the Microsoft Graph token is not set.",
        );
        return;
    }

    console.log(
        USE_MICROSOFT_MAIL
            ? "Watching returned contracts in Microsoft Graph."
            : "Watching returned contracts in the Google mailbox.",
    );

    const run = () => {
        void pollReturnedContracts().catch((error) => {
            console.error("Returned contract poll failed", error);
        });
    };

    run();
    const timer = setInterval(run, POLL_MS);
    timer.unref();
}

async function createRemainingOnboardingTasks(
    tx: Prisma.TransactionClient,
    params: {
        organizationId: string;
        workerEngagementId: string;
        actorUserId: string;
    },
) {
    const templates = await tx.issueTemplate.findMany({
        where: { organizationId: params.organizationId, isActive: true },
        include: { items: { orderBy: { orderIndex: "asc" } } },
        orderBy: { updatedAt: "desc" },
    });
    const template =
        templates.find((candidate) =>
            candidate.items.some((item) =>
                isQuestionnaireOrContractTemplateTask(item.title),
            ),
        ) ?? templates[0];
    if (!template) {
        throw new AppError(
            CONFLICT,
            "Keine aktive Aufgabenvorlage für das Onboarding.",
        );
    }

    const items = template.items.filter(
        (item) => !isQuestionnaireOrContractTemplateTask(item.title),
    );
    for (const item of items) {
        const issue = await tx.issue.create({
            data: {
                workerEngagementId: params.workerEngagementId,
                createdByUserId: params.actorUserId,
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
                actorUserId: params.actorUserId,
                action: "issue.created",
                newValue: {
                    title: item.title,
                    status: item.defaultStatus ?? "open",
                    assigneeUserId: item.defaultAssigneeUserId,
                    templateItemId: item.id,
                },
            },
        });
    }
}

export async function confirmReturnedEmploymentContract(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    actorUserId: string;
    issueId: string;
}) {
    const contract = await prisma.employmentContract.findFirst({
        where: {
            engagementId: params.engagementId,
            engagement: {
                workerId: params.workerId,
                organizationId: params.organizationId,
            },
        },
        select: {
            id: true,
            engagementId: true,
            confirmedAt: true,
            engagement: { select: { status: true } },
        },
    });
    if (!contract) {
        throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    }

    const issue = await prisma.issue.findFirst({
        where: {
            id: params.issueId,
            workerEngagementId: params.engagementId,
            kind: "contract_confirm",
        },
        select: { id: true },
    });
    if (!issue) {
        throw new AppError(NOT_FOUND, "Aufgabe nicht gefunden.");
    }

    if (contract.confirmedAt) return;

    await prisma.$transaction(async (tx) => {
        const claimed = await tx.employmentContract.updateMany({
            where: { id: contract.id, confirmedAt: null },
            data: {
                status: "signed",
                confirmedAt: new Date(),
                confirmedByUserId: params.actorUserId,
            },
        });
        if (claimed.count === 0) return;

        await tx.issue.delete({ where: { id: issue.id } });
        await createRemainingOnboardingTasks(tx, {
            organizationId: params.organizationId,
            workerEngagementId: contract.engagementId,
            actorUserId: params.actorUserId,
        });
        if (contract.engagement.status === "expected") {
            await tx.workerEngagement.update({
                where: { id: contract.engagementId },
                data: { status: "in_progress" },
            });
        }
    });

}
