import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { unmatchedQuestionnaireAnswers } from "@/services/contractFieldMatch";
import {
    readDocumentSegments,
    type DocumentSegment,
} from "@/services/documentBody";
import { generatePresignedUrl } from "@/config/aws";
import { RESEND_INBOUND_ADDRESS, USE_MICROSOFT_MAIL } from "@/constants/env";
import { sendGraphMail } from "@/services/graphMail";
import AppError from "@/utils/AppError";
import { sendMail } from "@/utils/sendMail";
import { Prisma } from "@prisma/client";
import {
    readStyledDocument,
    type StyledDocument,
} from "../../../shared/document";
import {
    prepareDocument,
    sendPreparedDocument,
    invalidatePreparedDocuments,
    outgoingPdfUrl,
    currentPreparation,
    DeliveryRejected,
} from "@/services/preparedDocument";

const VALUE_MAX = 8000;

type ContractParams = {
    organizationId: string;
    workerId: string;
    engagementId: string;
};

function inputKeys(segments: DocumentSegment[]): Set<string> {
    return new Set(
        segments
            .filter((segment) => segment.type === "input")
            .map((segment) => segment.key),
    );
}

function readDraftValues(
    input: Record<string, unknown>,
    allowed: Set<string>,
): { key: string; value: string }[] {
    const entries: { key: string; value: string }[] = [];
    for (const [key, raw] of Object.entries(input)) {
        if (typeof raw !== "string") {
            throw new AppError(BAD_REQUEST, "Ein Feldwert ist ungültig.");
        }
        if (!allowed.has(key)) {
            throw new AppError(
                BAD_REQUEST,
                "Ein Feld gehört nicht zu diesem Vertrag.",
            );
        }
        const value = raw.trim();
        if (value.length > VALUE_MAX) {
            throw new AppError(BAD_REQUEST, "Ein Feldwert ist zu lang.");
        }
        if (value.length > 0) entries.push({ key, value });
    }
    return entries;
}

const contractInclude = {
    master: true,
    values: true,
    engagement: {
        select: {
            questionnaireSubmission: {
                select: {
                    status: true,
                    answers: {
                        select: { key: true, value: true },
                    },
                },
            },
        },
    },
} satisfies Prisma.EmploymentContractInclude;

async function findContract(params: ContractParams) {
    return prisma.employmentContract.findFirst({
        where: {
            engagementId: params.engagementId,
            engagement: {
                workerId: params.workerId,
                organizationId: params.organizationId,
            },
        },
        include: contractInclude,
    });
}

function reloadContract(
    id: string,
    db: Prisma.TransactionClient | typeof prisma = prisma,
) {
    return db.employmentContract.findFirstOrThrow({
        where: { id },
        include: contractInclude,
    });
}

function present(
    contract: NonNullable<Awaited<ReturnType<typeof findContract>>>,
) {
    const followsMaster = !contract.sentAt && contract.status !== "signed";
    const segments = followsMaster
        ? readDocumentSegments(contract.master.body)
        : readDocumentSegments(contract.body ?? contract.master.body);
    const values: Record<string, string> = {};
    const allowed = inputKeys(segments);
    for (const entry of contract.values) {
        if (allowed.has(entry.key)) values[entry.key] = entry.value;
    }

    const submission = contract.engagement.questionnaireSubmission;
    const unmatchedAnswers =
        submission?.status === "completed"
            ? unmatchedQuestionnaireAnswers(
                  segments,
                  values,
                  submission.answers,
              )
            : [];

    return {
        id: contract.id,
        engagementId: contract.engagementId,
        masterId: contract.masterId,
        status: contract.status,
        name: contract.master.name,
        followsMaster,
        segments,
        document: readStyledDocument(
            followsMaster
                ? contract.master.body
                : (contract.body ?? contract.master.body),
        ),
        values,
        unmatchedAnswers,
        sentAt: contract.sentAt?.toISOString() ?? null,
        signedFileUrl: null as string | null,
        outgoingFileUrl: null as string | null,
    };
}

export async function getEngagementContract(params: ContractParams) {
    const contract = await findContract(params);
    if (!contract) return null;
    const view = present(contract);
    try {
        return {
            ...view,
            signedFileUrl: contract.fileUrl
                ? await generatePresignedUrl(contract.fileUrl)
                : null,
            outgoingFileUrl: await outgoingPdfUrl(
                {
                    organizationId: params.organizationId,
                    engagementId: params.engagementId,
                    kind: "employment_contract",
                },
                contract.outgoingPdfId,
            ),
            prepared: await currentPreparation({
                organizationId: params.organizationId,
                engagementId: params.engagementId,
                kind: "employment_contract",
            }),
        };
    } catch {
        return view;
    }
}

export async function saveEngagementContractDraft(
    params: ContractParams & { values: Record<string, unknown> },
) {
    const contract = await findContract(params);
    if (!contract) {
        throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    }
    if (contract.status === "signed" || contract.sentAt) {
        throw new AppError(CONFLICT, "Der Vertrag ist kein Entwurf mehr.");
    }

    const segments = readDocumentSegments(contract.master.body);
    const entries = readDraftValues(params.values, inputKeys(segments));

    const saved = await prisma.$transaction(async (tx) => {
        await invalidatePreparedDocuments(
            {
                organizationId: params.organizationId,
                engagementId: params.engagementId,
                kind: "employment_contract",
            },
            tx,
        );
        const latest = await tx.employmentContract.findUnique({
            where: { id: contract.id },
        });
        if (latest?.sentAt || latest?.status === "signed")
            throw new AppError(
                CONFLICT,
                "Der Vertrag wurde bereits versendet.",
            );
        if (contract.body !== null) {
            await tx.employmentContract.update({
                where: { id: contract.id },
                data: { body: Prisma.DbNull, status: "draft" },
            });
        }

        await tx.employmentContractValue.deleteMany({
            where: { employmentContractId: contract.id },
        });
        if (entries.length > 0) {
            await tx.employmentContractValue.createMany({
                data: entries.map((entry) => ({
                    employmentContractId: contract.id,
                    key: entry.key,
                    value: entry.value,
                })),
            });
        }

        return reloadContract(contract.id, tx);
    });

    return present(saved);
}

/**
 * Call when the user confirms the Personalfragebogen is back and this contract can be sent.
 * Copies the current master text onto the child and locks text and input fields.
 */
export async function confirmEngagementContractForSend(params: ContractParams) {
    const contract = await findContract(params);
    if (!contract) {
        throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    }
    if (contract.status === "ready") return present(contract);
    if (contract.status !== "draft") {
        throw new AppError(CONFLICT, "Der Vertrag ist kein Entwurf mehr.");
    }

    await prisma.employmentContract.update({
        where: { id: contract.id },
        data: {
            body: readStyledDocument(
                contract.master.body,
            ) as unknown as Prisma.InputJsonValue,
            status: "ready",
        },
    });
    const saved = await reloadContract(contract.id);

    return present(saved);
}

export async function prepareEmploymentContractPdf(
    params: ContractParams & { values: Record<string, unknown> },
) {
    const contract = await findContract(params);
    if (!contract || contract.sentAt || contract.status === "signed")
        throw new AppError(CONFLICT, "Vertrag kann nicht vorbereitet werden.");
    await saveEngagementContractDraft(params);
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: { email: true },
    });
    if (!worker?.email) throw new AppError(BAD_REQUEST, "Empfänger fehlt.");
    return prepareDocument({
        ...params,
        kind: "employment_contract",
        masterId: contract.masterId,
        recipient: worker.email,
    });
}

export async function sendFilledEmploymentContract(
    params: ContractParams & {
        actorUserId: string;
        issueId: string;
        artifactId: string;
    },
) {
    const contract = await findContract(params);
    if (!contract) throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    const issue = await prisma.issue.findFirst({
        where: {
            id: params.issueId,
            workerEngagementId: params.engagementId,
            kind: "contract_send",
            workerEngagement: { organizationId: params.organizationId },
        },
    });
    if (!issue) throw new AppError(NOT_FOUND, "Aufgabe nicht gefunden.");
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: { email: true },
    });
    if (!worker?.email) throw new AppError(BAD_REQUEST, "Empfänger fehlt.");
    const selected = await prisma.preparedDocument.findFirst({
        where: {
            id: params.artifactId,
            masterId: contract.masterId,
            organizationId: params.organizationId,
        },
    });
    if (!selected)
        throw new AppError(
            CONFLICT,
            "PDF gehört nicht zur ausgewählten Vorlage.",
        );
    await sendPreparedDocument({
        organizationId: params.organizationId,
        engagementId: params.engagementId,
        kind: "employment_contract",
        artifactId: params.artifactId,
        actorUserId: params.actorUserId,
        recipient: worker.email,
        deliver: async (attachment, artifactId) => {
            if (USE_MICROSOFT_MAIL) {
                const sent = await sendGraphMail({
                    to: worker.email,
                    subject: "Ihr Arbeitsvertrag",
                    html: "<p>Anbei Ihr Arbeitsvertrag als PDF.</p>",
                    attachments: [attachment],
                });
                return sent.conversationId;
            }
            const token = artifactId;
            const sent = await sendMail({
                to: worker.email,
                subject: `Ihr Arbeitsvertrag [${token}]`,
                text: "Anbei Ihr Arbeitsvertrag als PDF. Referenz: " + token,
                html:
                    "<p>Anbei Ihr Arbeitsvertrag als PDF.</p><p>Referenz: " +
                    token +
                    "</p>",
                headers: { "X-Handwerk-Contract": token },
                attachments: [attachment],
                idempotencyKey: artifactId,
                ...(RESEND_INBOUND_ADDRESS
                    ? { replyTo: RESEND_INBOUND_ADDRESS }
                    : {}),
            });
            if (sent.error) {
                if (
                    [
                        "validation_error",
                        "invalid_parameter",
                        "missing_required_field",
                        "restricted_api_key",
                        "invalid_api_key",
                    ].includes(sent.error.name)
                )
                    throw new DeliveryRejected(sent.error.message);
                throw new Error(sent.error.message);
            }
            return "resend:" + token;
        },
        finalize: async (tx, document, values, artifactId, providerId) => {
            await tx.employmentContractValue.deleteMany({
                where: { employmentContractId: contract.id },
            });
            const entries = Object.entries(values);
            if (entries.length)
                await tx.employmentContractValue.createMany({
                    data: entries.map(([key, value]) => ({
                        employmentContractId: contract.id,
                        key,
                        value,
                    })),
                });
            await tx.employmentContract.update({
                where: { id: contract.id },
                data: {
                    body: document as unknown as Prisma.InputJsonValue,
                    outgoingPdfId: artifactId,
                    status: "ready",
                    sentAt: new Date(),
                    conversationId: providerId,
                },
            });
            await tx.issue.deleteMany({ where: { id: issue.id } });
        },
    });
    return present((await findContract(params)) ?? contract);
}
