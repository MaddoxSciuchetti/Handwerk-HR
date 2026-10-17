import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { unmatchedQuestionnaireAnswers, type MatchField } from "@/services/contractFieldMatch";
import { matchQuestionnaireToContract } from "@/services/contractFieldMatchAi";
import {
    definitionFields,
    parseQuestionnaireDefinition,
} from "@/services/questionnaireDefinition";
import {
    QUESTIONNAIRE_FIELDS,
    questionnaireAnswersFromStored,
} from "@/services/questionnaireForm";
import {
    readDocumentSegments,
    type DocumentSegment,
} from "@/services/documentBody";
import { downloadStoredFile, generatePresignedUrl } from "@/config/aws";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";
import {
    readStyledDocument,
    type StyledDocument,
} from "../../../shared/document";
import {
    prepareDocument,
    invalidatePreparedDocuments,
    outgoingPdfUrl,
    currentPreparation,
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

function matchFieldsFrom(value: unknown): MatchField[] {
    const fields = (() => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return QUESTIONNAIRE_FIELDS;
        }
        try {
            return definitionFields(parseQuestionnaireDefinition(value));
        } catch {
            return QUESTIONNAIRE_FIELDS;
        }
    })();
    return fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        contractFieldKey:
            "contractFieldKey" in field && typeof field.contractFieldKey === "string"
                ? field.contractFieldKey
                : undefined,
    }));
}

const contractInclude = {
    master: true,
    values: true,
    engagement: {
        select: {
            questionnaireSubmission: {
                select: {
                    status: true,
                    formDefinition: true,
                    answers: {
                        select: { key: true, value: true },
                    },
                },
            },
            worker: { select: { email: true } },
        },
    },
} satisfies Prisma.EmploymentContractInclude;

async function loadContract(params: ContractParams) {
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

async function alignUnsentContractToPrimary(
    contract: NonNullable<Awaited<ReturnType<typeof loadContract>>>,
    organizationId: string,
) {
    if (contract.sentAt || contract.status === "signed") return contract;
    const primary = await prisma.documentMaster.findFirst({
        where: {
            organizationId,
            kind: "employment_contract",
            isPrimary: true,
            deletedAt: null,
        },
        select: { id: true },
    });
    if (!primary || primary.id === contract.masterId) return contract;

    await prisma.$transaction(async (tx) => {
        await invalidatePreparedDocuments(
            {
                organizationId,
                engagementId: contract.engagementId,
                kind: "employment_contract",
            },
            tx,
        );
        const latest = await tx.employmentContract.findUnique({
            where: { id: contract.id },
            select: { sentAt: true, status: true },
        });
        if (!latest || latest.sentAt || latest.status === "signed") return;
        await tx.employmentContract.update({
            where: { id: contract.id },
            data: {
                masterId: primary.id,
                body: Prisma.DbNull,
                status: "draft",
                matchedMasterRevision: null,
            },
        });
    });
    return reloadContract(contract.id);
}

async function findContract(params: ContractParams) {
    const contract = await loadContract(params);
    if (!contract) return null;
    return alignUnsentContractToPrimary(contract, params.organizationId);
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
    const matchFields = matchFieldsFrom(submission?.formDefinition);
    const unmatchedAnswers =
        submission?.status === "completed"
            ? unmatchedQuestionnaireAnswers(
                  segments,
                  values,
                  submission.answers,
                  matchFields,
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
        masterRevision: contract.master.revision,
        matchedMasterRevision: contract.matchedMasterRevision,
        questionnaireCompleted: submission?.status === "completed",
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

export async function persistMatchedContractValues(
    tx: Prisma.TransactionClient,
    params: {
        contractId: string;
        entries: { key: string; value: string }[];
        masterRevision: number;
    },
) {
    await tx.employmentContractValue.deleteMany({
        where: { employmentContractId: params.contractId },
    });
    if (params.entries.length > 0) {
        await tx.employmentContractValue.createMany({
            data: params.entries.map((entry) => ({
                employmentContractId: params.contractId,
                key: entry.key,
                value: entry.value,
            })),
        });
    }
    await tx.employmentContract.update({
        where: { id: params.contractId },
        data: { matchedMasterRevision: params.masterRevision },
    });
}

export async function resyncEngagementContractFromQuestionnaire(
    params: ContractParams,
) {
    const contract = await findContract(params);
    if (!contract) {
        throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    }
    if (contract.sentAt || contract.status === "signed") {
        throw new AppError(CONFLICT, "Der Vertrag wurde bereits versendet.");
    }
    const submission = contract.engagement.questionnaireSubmission;
    if (!submission || submission.status !== "completed") {
        throw new AppError(
            BAD_REQUEST,
            "Der Fragebogen ist noch nicht ausgefüllt.",
        );
    }

    const answers = questionnaireAnswersFromStored(submission.answers);
    const segments = readDocumentSegments(contract.master.body);
    const entries = await matchQuestionnaireToContract(
        segments,
        answers,
        contract.engagement.worker.email ?? "",
        matchFieldsFrom(submission.formDefinition),
    );

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
        if (latest?.sentAt || latest?.status === "signed") {
            throw new AppError(
                CONFLICT,
                "Der Vertrag wurde bereits versendet.",
            );
        }
        await persistMatchedContractValues(tx, {
            contractId: contract.id,
            entries,
            masterRevision: contract.master.revision,
        });
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
    return prepareDocument({
        ...params,
        kind: "employment_contract",
        masterId: contract.masterId,
        recipient: worker?.email?.trim() || "buero",
    });
}

export async function readPreparedEmploymentContractPdf(
    params: ContractParams & { artifactId: string },
) {
    const contract = await findContract(params);
    if (!contract) throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    const selected = await prisma.preparedDocument.findFirst({
        where: {
            id: params.artifactId,
            masterId: contract.masterId,
            organizationId: params.organizationId,
            engagementId: params.engagementId,
            kind: "employment_contract",
        },
    });
    if (!selected) throw new AppError(NOT_FOUND, "PDF nicht gefunden.");
    return downloadStoredFile(selected.s3Key);
}

export async function sendFilledEmploymentContract(
    _params: ContractParams & {
        actorUserId: string;
        issueId: string;
        artifactId: string;
    },
) {
    throw new AppError(
        CONFLICT,
        "Der Arbeitsvertrag wird im Büro gedruckt und nicht per E-Mail versendet.",
    );
}
