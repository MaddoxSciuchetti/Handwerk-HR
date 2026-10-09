import { NOT_FOUND } from "@/constants/http";
import { RESEND_INBOUND_ADDRESS, USE_MICROSOFT_MAIL } from "@/constants/env";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3 } from "@/config/aws";
import resend from "@/config/resend";
import {
    downloadReplyPdf,
    findInboxReply,
    graphMailConfigured,
} from "@/services/graphMail";
import { provisionMicrosoft365Account } from "@/services/microsoft365Account";
import { sendTeamWelcomeMail } from "@/services/welcomeMail";
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

        const closedEarly = await tx.issue.findMany({
            where: {
                workerEngagementId: engagementId,
                title: "Arbeitsvertrag",
                kind: "standard",
                status: "done",
            },
        });
        for (const contractTask of closedEarly) {
            await tx.issue.update({
                where: { id: contractTask.id },
                data: { status: "open" },
            });
            await tx.issueAuditLog.create({
                data: {
                    issueId: contractTask.id,
                    actorUserId,
                    action: "issue.updated",
                    oldValue: { status: "done" },
                    newValue: { status: "open" },
                },
            });
        }

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

const waitingContractSelect = {
    id: true,
    fileUrl: true,
    engagement: {
        select: {
            id: true,
            workerId: true,
            responsibleUserId: true,
            issues: {
                where: { kind: "contract_confirm" as const },
                select: { id: true },
                take: 1,
            },
        },
    },
} satisfies Prisma.EmploymentContractSelect;

async function tokenFromReply(params: { subject: string; emailId: string }) {
    const fromSubject = contractTokenFromSubject(params.subject);
    if (fromSubject) return fromSubject;

    const email = await resend.emails.receiving.get(params.emailId);
    if (email.error || !email.data) return null;
    const body = email.data as {
        subject?: string | null;
        text?: string | null;
        html?: string | null;
        headers?: Record<string, string> | null;
    };
    const headerToken = Object.entries(body.headers ?? {}).find(
        ([key]) => key.toLowerCase() === "x-handwerk-contract",
    )?.[1];
    if (headerToken && CONTRACT_TOKEN.test(headerToken)) return headerToken;
    return contractTokenFromSubject(
        [body.subject, body.text, body.html].filter(Boolean).join("\n"),
    );
}

export async function ingestResendContractReply(params: {
    subject: string;
    emailId: string;
    hasPdf?: boolean | null;
}) {
    const token = await tokenFromReply(params);
    const contract = token
        ? await prisma.employmentContract.findFirst({
              where: {
                  conversationId: `${RESEND_MATCH}${token}`,
                  confirmedAt: null,
                  status: "ready",
              },
              select: waitingContractSelect,
          })
        : await onlyWaitingContract(params.hasPdf);
    if (!contract || contract.engagement.issues.length > 0) return;

    let storedPdf = Boolean(contract.fileUrl);
    if (!storedPdf) {
        try {
            const pdf = await downloadResendPdf(params.emailId);
            if (pdf) {
                await storeSignedPdf({
                    contractId: contract.id,
                    workerId: contract.engagement.workerId,
                    uploadedByUserId: contract.engagement.responsibleUserId,
                    pdf,
                });
                storedPdf = true;
            }
        } catch (error) {
            console.error(
                "Signed contract PDF could not be stored",
                contract.id,
                error,
            );
        }
    }
    if (!token && !storedPdf) return;

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

async function onlyWaitingContract(hasPdf?: boolean | null) {
    if (hasPdf === false) return null;
    const waiting = await prisma.employmentContract.findMany({
        where: {
            confirmedAt: null,
            status: "ready",
            sentAt: { not: null },
            engagement: { issues: { none: { kind: "contract_confirm" } } },
        },
        select: waitingContractSelect,
    });
    if (waiting.length !== 1) {
        if (waiting.length > 1) {
            console.log(
                `Returned contract email has no reference; ${waiting.length} contracts are waiting.`,
            );
        }
        return null;
    }
    return waiting[0];
}

function receivedMessages(payload: unknown) {
    if (!payload || typeof payload !== "object") return [];
    const body = payload as { data?: unknown };
    const rows = Array.isArray(body.data)
        ? body.data
        : body.data &&
            typeof body.data === "object" &&
            Array.isArray((body.data as { data?: unknown }).data)
          ? (body.data as { data: unknown[] }).data
          : [];
    return rows.flatMap((row) => {
        if (!row || typeof row !== "object") return [];
        const message = row as {
            id?: unknown;
            subject?: unknown;
            created_at?: unknown;
            attachments?: unknown;
        };
        if (typeof message.id !== "string") return [];
        const attachments = Array.isArray(message.attachments)
            ? message.attachments
            : null;
        const hasPdf = attachments?.some((attachment) => {
            if (!attachment || typeof attachment !== "object") return false;
            const file = attachment as {
                filename?: unknown;
                content_type?: unknown;
            };
            const name =
                typeof file.filename === "string" ? file.filename.toLowerCase() : "";
            return file.content_type === "application/pdf" || name.endsWith(".pdf");
        });
        return [
            {
                id: message.id,
                subject: typeof message.subject === "string" ? message.subject : "",
                createdAt:
                    typeof message.created_at === "string" ? message.created_at : "",
                hasPdf: attachments ? Boolean(hasPdf) : null,
            },
        ];
    });
}

async function pollResendInbox() {
    const listed = await resend.emails.receiving.list({ limit: 100 });
    if (listed.error || !listed.data) {
        console.error("Resend receiving inbox could not be read", listed.error);
        return;
    }
    const messages = receivedMessages(listed.data).sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
    );
    for (const message of messages) {
        await ingestResendContractReply({
            subject: message.subject,
            emailId: message.id,
            hasPdf: message.hasPdf,
        });
    }
}

export async function pollReturnedContracts() {
    if (!USE_MICROSOFT_MAIL) {
        await pollResendInbox();
        return;
    }
    if (!graphMailConfigured()) return;

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
    if (USE_MICROSOFT_MAIL && !graphMailConfigured()) {
        console.log(
            "USE_MICROSOFT_MAIL is on, but the Microsoft Graph token is not set.",
        );
        return;
    }
    if (!USE_MICROSOFT_MAIL && !RESEND_INBOUND_ADDRESS) {
        console.log(
            "RESEND_INBOUND_ADDRESS is not set. Replies are still watched, but new contract mail has no Reply-To address.",
        );
    }

    console.log(
        USE_MICROSOFT_MAIL
            ? "Watching returned contracts in Microsoft Graph."
            : "Watching returned contracts in the Resend inbox.",
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
    if (!template) return;

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

    let claimedConfirmation = false;
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
        claimedConfirmation = true;

        await tx.issue.delete({ where: { id: issue.id } });
        const contractTasks = await tx.issue.findMany({
            where: {
                workerEngagementId: contract.engagementId,
                title: "Arbeitsvertrag",
                kind: "standard",
                status: { not: "done" },
            },
        });
        for (const contractTask of contractTasks) {
            await tx.issue.update({
                where: { id: contractTask.id },
                data: { status: "done" },
            });
            await tx.issueAuditLog.create({
                data: {
                    issueId: contractTask.id,
                    actorUserId: params.actorUserId,
                    action: "issue.updated",
                    oldValue: { status: contractTask.status },
                    newValue: { status: "done" },
                },
            });
        }
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

    if (!claimedConfirmation) return;

    try {
        const result = await provisionMicrosoft365Account({
            organizationId: params.organizationId,
            workerId: params.workerId,
        });
        if (result.status === "failed") {
            console.error(
                "Microsoft 365 Konto wurde nicht angelegt.",
                result.message,
            );
            return;
        }
        const accountReady =
            result.status === "created" ||
            (result.status === "skipped" &&
                result.reason === "already_provisioned");
        if (!accountReady) return;

        try {
            const welcome = await sendTeamWelcomeMail({
                organizationId: params.organizationId,
                workerId: params.workerId,
                engagementId: params.engagementId,
                actorUserId: params.actorUserId,
            });
            if (welcome.status === "failed") {
                console.error(
                    "Willkommensmail wurde nicht gesendet.",
                    welcome.message,
                );
            }
        } catch (error) {
            console.error("Willkommensmail wurde nicht gesendet.", error);
        }
    } catch (error) {
        console.error("Microsoft 365 Konto wurde nicht angelegt.", error);
    }
}
