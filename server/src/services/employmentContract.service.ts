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
    resolveCurrentDateValues,
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
                    id: true,
                    revision: true,
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
        // Fetch the template, values and questionnaire in one database round trip.
        relationLoadStrategy: "join",
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

// The organisation default is selected at creation. Reads must preserve the
// template chosen for this particular worker's contract.
async function findContract(params: ContractParams) {
    return loadContract(params);
}

function reloadContract(
    id: string,
    db: Prisma.TransactionClient | typeof prisma = prisma,
) {
    return db.employmentContract.findFirstOrThrow({
        relationLoadStrategy: "join",
        where: { id },
        include: contractInclude,
    });
}

function present(
    contract: NonNullable<Awaited<ReturnType<typeof findContract>>>,
) {
    const followsMaster = !contract.printedAt && !contract.sentAt && contract.status !== "signed";
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
        values: followsMaster
            ? resolveCurrentDateValues(readStyledDocument(contract.master.body), values)
            : values,
        unmatchedAnswers,
        questionnaireAnswers:
            submission?.status === "completed"
                ? unmatchedQuestionnaireAnswers([], {}, submission.answers, matchFields)
                : [],
        masterRevision: contract.master.revision,
        matchedMasterRevision: contract.matchedMasterRevision,
        questionnaireCompleted: submission?.status === "completed",
        questionnaireRevision: submission?.revision ?? 0,
        matchedQuestionnaireRevision: contract.matchedQuestionnaireRevision ?? 0,
        questionnaireSyncNeeded: submission?.status === "completed" &&
            (submission.revision ?? 0) > (contract.matchedQuestionnaireRevision ?? 0),
        printedAt: contract.printedAt?.toISOString() ?? null,
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
            prepared: contract.printedAt ? null : await currentPreparation({
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
    if (contract.printedAt || contract.status === "signed" || contract.sentAt) {
        throw new AppError(CONFLICT, "Der Vertrag ist kein Entwurf mehr.");
    }

    const segments = readDocumentSegments(contract.master.body);
    const manualEntries = readDraftValues(params.values, inputKeys(segments));
    const entries = Object.entries(
        resolveCurrentDateValues(
            readStyledDocument(contract.master.body),
            Object.fromEntries(
                manualEntries.map((entry) => [entry.key, entry.value]),
            ),
        ),
    ).map(([key, value]) => ({ key, value }));

    const saved = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM worker_engagements WHERE id = ${params.engagementId} FOR UPDATE`;
        const latest = await tx.employmentContract.findUnique({
            where: { id: contract.id },
            include: { values: true },
        });
        if (latest?.printedAt || latest?.sentAt || latest?.status === "signed")
            throw new AppError(
                CONFLICT,
                latest?.printedAt ? "Der Vertrag wurde bereits gedruckt." : "Der Vertrag wurde bereits versendet.",
            );
        if (!latest || latest.masterId !== contract.masterId) {
            throw new AppError(
                CONFLICT,
                "Die Vertragsvorlage wurde inzwischen geändert. Bitte erneut öffnen.",
            );
        }
        const unchanged =
            latest.values.length === entries.length &&
            entries.every((entry) =>
                latest.values.some(
                    (saved) =>
                        saved.key === entry.key && saved.value === entry.value,
                ),
            );
        if (unchanged && latest.body === null)
            return reloadContract(contract.id, tx);

        await invalidatePreparedDocuments(
            {
                organizationId: params.organizationId,
                engagementId: params.engagementId,
                kind: "employment_contract",
            },
            tx,
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

    return {
        ...present(saved),
        prepared: await currentPreparation({
            organizationId: params.organizationId,
            engagementId: params.engagementId,
            kind: "employment_contract",
        }),
    };
}

export async function persistMatchedContractValues(
    tx: Prisma.TransactionClient,
    params: {
        contractId: string;
        entries: { key: string; value: string }[];
        masterRevision: number;
        preserveDescriptionPoints?: boolean;
    },
) {
    await tx.$queryRaw`SELECT id FROM employment_contracts WHERE id = ${params.contractId} FOR UPDATE`;
    const current = await tx.employmentContract.findUnique({
        where: { id: params.contractId },
        include: { master: true, values: true },
    });
    if (current?.printedAt || current?.sentAt || current?.status === "signed") return;
    const segments = current ? readDocumentSegments(current.master.body) : [];
    const allowed = inputKeys(segments);
    const pointKeys = new Set(
        segments.flatMap((segment) =>
            segment.type === "input" && segment.fieldType === "points"
                ? [segment.key]
                : [],
        ),
    );
    const matchedKeys = new Set(params.entries.map((entry) => entry.key));
    // Matching only supplies questionnaire-backed fields. Keep manual values
    // (e.g. pay and allowances) for inputs still present in the target template.
    const preserved = (current?.values ?? [])
        .filter(
            (entry) => allowed.has(entry.key) && entry.value.trim().length > 0 &&
                (pointKeys.has(entry.key)
                    ? params.preserveDescriptionPoints !== false
                    : !matchedKeys.has(entry.key)),
        )
        .map((entry) => ({ key: entry.key, value: entry.value }));
    const entries = [
        ...params.entries.filter((entry) => !pointKeys.has(entry.key)),
        ...preserved,
    ];

    await tx.employmentContractValue.deleteMany({
        where: { employmentContractId: params.contractId },
    });
    if (entries.length > 0) {
        await tx.employmentContractValue.createMany({
            data: entries.map((entry) => ({
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
    params: ContractParams & { masterId?: string },
) {
    const contract = await findContract(params);
    if (!contract) {
        throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    }
    if (contract.printedAt || contract.sentAt || contract.status === "signed") {
        throw new AppError(CONFLICT, contract.printedAt ? "Der Vertrag wurde bereits gedruckt." : "Der Vertrag wurde bereits versendet.");
    }
    const submission = contract.engagement.questionnaireSubmission;
    if (!submission || submission.status !== "completed") {
        throw new AppError(
            BAD_REQUEST,
            "Der Fragebogen ist noch nicht ausgefüllt.",
        );
    }

    const master = params.masterId
        ? await prisma.documentMaster.findFirst({
              where: {
                  id: params.masterId,
                  organizationId: params.organizationId,
                  kind: "employment_contract",
                  deletedAt: null,
              },
          })
        : contract.master;
    if (!master) throw new AppError(NOT_FOUND, "Vertragsvorlage nicht gefunden.");
    const switchingTemplate = Boolean(params.masterId && master.id !== contract.masterId);
    const answers = questionnaireAnswersFromStored(submission.answers);
    const segments = readDocumentSegments(master.body);
    const entries = await matchQuestionnaireToContract(
        segments,
        answers,
        contract.engagement.worker.email ?? "",
        matchFieldsFrom(submission.formDefinition),
    );

    const saved = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM worker_engagements WHERE id = ${params.engagementId} FOR UPDATE`;
        // Claim the exact questionnaire revision used for matching. A concurrent
        // correction must never be marked as synchronized without being applied.
        const claimed = await tx.questionnaireSubmission.updateMany({
            where: { id: submission.id, revision: submission.revision, status: "completed" },
            data: { revision: submission.revision },
        });
        if (claimed.count !== 1) throw new AppError(CONFLICT, "Der Fragebogen wurde inzwischen geändert. Bitte erneut synchronisieren.");
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
        if (latest?.printedAt || latest?.sentAt || latest?.status === "signed") {
            throw new AppError(
                CONFLICT,
                latest?.printedAt ? "Der Vertrag wurde bereits gedruckt." : "Der Vertrag wurde bereits versendet.",
            );
        }
        if (!latest || latest.masterId !== contract.masterId) {
            throw new AppError(CONFLICT, "Die Vertragsvorlage wurde inzwischen geändert.");
        }
        if (params.masterId) {
            const currentMaster = await tx.documentMaster.findFirst({
                where: {
                    id: master.id,
                    organizationId: params.organizationId,
                    kind: "employment_contract",
                    deletedAt: null,
                    revision: master.revision,
                },
            });
            if (!currentMaster) throw new AppError(CONFLICT, "Die Vertragsvorlage hat sich geändert. Bitte erneut auswählen.");
        }
        if (switchingTemplate) {
            await tx.employmentContract.update({
                where: { id: contract.id },
                data: {
                    masterId: master.id,
                    body: Prisma.DbNull,
                    status: "draft",
                    outgoingPdfId: null,
                },
            });
        }
        await persistMatchedContractValues(tx, {
            contractId: contract.id,
            entries,
            masterRevision: master.revision,
            preserveDescriptionPoints: !switchingTemplate,
        });
        await tx.employmentContract.update({
            where: { id: contract.id },
            data: {
                matchedQuestionnaireRevision: submission.revision,
                status: "draft",
                body: Prisma.DbNull,
                outgoingPdfId: null,
            },
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
    if (contract.printedAt || contract.status === "ready") return present(contract);
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
    params: ContractParams & { values: Record<string, unknown>; includeBytes?: boolean },
) {
    const contract = await findContract(params);
    if (!contract || contract.printedAt || contract.sentAt || contract.status === "signed")
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

/** Completion records the paper contract independently of email delivery.
 * Reopening the task deliberately does not release this snapshot.
 */
export async function freezePrintedContract(tx: Prisma.TransactionClient, engagementId: string) {
    await tx.$queryRaw`SELECT id FROM worker_engagements WHERE id = ${engagementId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM employment_contracts WHERE engagement_id = ${engagementId} FOR UPDATE`;
    const contract = await tx.employmentContract.findUnique({
        where: { engagementId },
        include: { master: true, values: true },
    });
    if (!contract || contract.printedAt || contract.sentAt || contract.status === "signed") return;
    const document = readStyledDocument(contract.master.body);
    const savedValues = Object.fromEntries(contract.values.map((entry) => [entry.key, entry.value]));
    const values = resolveCurrentDateValues(document, savedValues);
    await tx.employmentContract.update({
        where: { id: contract.id },
        data: {
            printedAt: new Date(),
            body: document as unknown as Prisma.InputJsonValue,
            status: "ready",
        },
    });
    for (const [key, value] of Object.entries(values)) {
        if (savedValues[key] === value) continue;
        await tx.employmentContractValue.upsert({
            where: { employmentContractId_key: { employmentContractId: contract.id, key } },
            create: { employmentContractId: contract.id, key, value },
            update: { value },
        });
    }
}

export async function downloadPrintedContract(params: ContractParams) {
    const contract = await findContract(params);
    if (!contract?.printedAt || !contract.body)
        throw new AppError(NOT_FOUND, "Gedruckter Vertrag nicht gefunden.");
    const { generateDocumentPdf } = await import("@/services/documentPdf");
    const pdf = await generateDocumentPdf(readStyledDocument(contract.body),
        Object.fromEntries(contract.values.map((entry) => [entry.key, entry.value])));
    return pdf.bytes;
}
