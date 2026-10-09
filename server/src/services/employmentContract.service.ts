import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { unmatchedQuestionnaireAnswers } from "@/services/contractFieldMatch";
import {
    documentBody,
    readDocumentSegments,
    type DocumentSegment,
} from "@/services/documentBody";
import { sendMail } from "@/utils/sendMail";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";

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
    const followsMaster = contract.status === "draft";
    const segments = followsMaster
        ? readDocumentSegments(contract.master.body)
        : readDocumentSegments(contract.body ?? contract.master.body);
    const values: Record<string, string> = {};
    for (const entry of contract.values) {
        values[entry.key] = entry.value;
    }

    const submission = contract.engagement.questionnaireSubmission;
    const unmatchedAnswers =
        submission?.status === "completed"
            ? unmatchedQuestionnaireAnswers(segments, values, submission.answers)
            : [];

    return {
        id: contract.id,
        engagementId: contract.engagementId,
        masterId: contract.masterId,
        status: contract.status,
        name: contract.master.name,
        followsMaster,
        segments,
        values,
        unmatchedAnswers,
        sentAt: contract.sentAt?.toISOString() ?? null,
    };
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function contractMessage(
    name: string,
    segments: DocumentSegment[],
    values: Record<string, string>,
) {
    const textParts = segments.map((segment) =>
        segment.type === "text" ? segment.text : (values[segment.key] ?? ""),
    );
    const text = [`Ihr Arbeitsvertrag: ${name}`, "", textParts.join("")].join("\n");
    const htmlBody = segments
        .map((segment) => {
            if (segment.type === "text") {
                return escapeHtml(segment.text).replaceAll("\n", "<br>");
            }
            return `<strong>${escapeHtml(values[segment.key] ?? "")}</strong>`;
        })
        .join("");
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6"><p>anbei Ihr Arbeitsvertrag.</p><h1>${escapeHtml(name)}</h1><div>${htmlBody}</div></div>`;
    return { text, html };
}

export async function getEngagementContract(params: ContractParams) {
    const contract = await findContract(params);
    if (!contract) return null;
    return present(contract);
}

export async function saveEngagementContractDraft(
    params: ContractParams & { values: Record<string, unknown> },
) {
    const contract = await findContract(params);
    if (!contract) {
        throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    }
    if (contract.status !== "draft") {
        throw new AppError(CONFLICT, "Der Vertrag ist kein Entwurf mehr.");
    }

    const segments = readDocumentSegments(contract.master.body);
    const entries = readDraftValues(params.values, inputKeys(segments));

    const saved = await prisma.$transaction(async (tx) => {
        if (contract.body !== null) {
            await tx.employmentContract.update({
                where: { id: contract.id },
                data: { body: Prisma.DbNull },
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

    const segments = readDocumentSegments(contract.master.body);
    await prisma.employmentContract.update({
        where: { id: contract.id },
        data: {
            body: documentBody(segments),
            status: "ready",
        },
    });
    const saved = await reloadContract(contract.id);

    return present(saved);
}

export async function sendFilledEmploymentContract(
    params: ContractParams & {
        actorUserId: string;
        issueId: string;
        values: Record<string, unknown>;
    },
) {
    const contract = await findContract(params);
    if (!contract) {
        throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    }

    const issue = await prisma.issue.findFirst({
        where: {
            id: params.issueId,
            workerEngagementId: params.engagementId,
            kind: "contract_send",
        },
    });
    if (!issue) {
        throw new AppError(NOT_FOUND, "Aufgabe nicht gefunden.");
    }

    let current = contract;
    if (current.status === "draft") {
        const segments = readDocumentSegments(current.master.body);
        const allowed = inputKeys(segments);
        const entries = readDraftValues(params.values, allowed);
        const filled = new Set(entries.map((entry) => entry.key));
        for (const key of allowed) {
            if (!filled.has(key)) {
                throw new AppError(
                    BAD_REQUEST,
                    "Bitte füllen Sie alle Vertragsfelder aus.",
                );
            }
        }
        await prisma.$transaction(async (tx) => {
            await tx.employmentContractValue.deleteMany({
                where: { employmentContractId: current.id },
            });
            if (entries.length > 0) {
                await tx.employmentContractValue.createMany({
                    data: entries.map((entry) => ({
                        employmentContractId: current.id,
                        key: entry.key,
                        value: entry.value,
                    })),
                });
            }
        });
        await confirmEngagementContractForSend(params);
        current = (await findContract(params)) ?? current;
    } else if (current.status !== "ready") {
        throw new AppError(CONFLICT, "Der Vertrag ist kein Entwurf mehr.");
    }

    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: { email: true },
    });
    if (!worker) {
        throw new AppError(NOT_FOUND, "Mitarbeiter nicht gefunden.");
    }

    const ready = present((await findContract(params)) ?? current);
    const message = contractMessage(ready.name, ready.segments, ready.values);
    await sendMail({
        to: worker.email,
        subject: "Ihr Arbeitsvertrag",
        text: message.text,
        html: message.html,
    });

    await prisma.$transaction(async (tx) => {
        await tx.employmentContract.update({
            where: { id: current.id },
            data: { sentAt: new Date() },
        });
        if (issue.status !== "done") {
            await tx.issue.update({
                where: { id: issue.id },
                data: { status: "done" },
            });
            await tx.issueAuditLog.create({
                data: {
                    issueId: issue.id,
                    actorUserId: params.actorUserId,
                    action: "issue.updated",
                    oldValue: { status: issue.status },
                    newValue: { status: "done" },
                },
            });
        }
    });

    return present((await findContract(params)) ?? current);
}
