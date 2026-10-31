import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { unmatchedQuestionnaireAnswers, type MatchField } from "@/services/contractFieldMatch";
import { matchQuestionnaireToContract } from "@/services/contractFieldMatchAi";
import { readDocumentSegments, type DocumentSegment } from "@/services/documentBody";
import { generateDocumentPdf } from "@/services/documentPdf";
import {
    definitionFields,
    parseQuestionnaireDefinition,
} from "@/services/questionnaireDefinition";
import {
    QUESTIONNAIRE_FIELDS,
    questionnaireAnswersFromStored,
} from "@/services/questionnaireForm";
import { parseStyledDocument } from "@/services/styledDocument";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";
import { readStyledDocument, resolveCurrentDateValues } from "../../../shared/document";
import { validateFieldValues } from "../../../shared/documentRendering";

const VALUE_MAX = 8000;

type Scope = {
    organizationId: string;
    workerId: string;
    engagementId: string;
};

const documentInclude = {
    master: true,
    values: true,
    engagement: {
        select: {
            questionnaireSubmission: {
                select: {
                    status: true,
                    formDefinition: true,
                    answers: { select: { key: true, value: true } },
                },
            },
            worker: { select: { email: true } },
        },
    },
} satisfies Prisma.EngagementTemplateDocumentInclude;

type StoredDocument = Prisma.EngagementTemplateDocumentGetPayload<{
    include: typeof documentInclude;
}>;

function inputKeys(segments: DocumentSegment[]) {
    return new Set(
        segments
            .filter((segment) => segment.type === "input")
            .map((segment) => segment.key),
    );
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

function readDraftValues(
    input: Record<string, unknown>,
    allowed: Set<string>,
) {
    const entries: { key: string; value: string }[] = [];
    for (const [key, raw] of Object.entries(input)) {
        if (typeof raw !== "string") {
            throw new AppError(BAD_REQUEST, "Ein Feldwert ist ungültig.");
        }
        if (!allowed.has(key)) {
            throw new AppError(BAD_REQUEST, "Ein Feld gehört nicht zu diesem Dokument.");
        }
        const value = raw.trim();
        if (value.length > VALUE_MAX) {
            throw new AppError(BAD_REQUEST, "Ein Feldwert ist zu lang.");
        }
        if (value.length > 0) entries.push({ key, value });
    }
    return entries;
}

function present(document: StoredDocument) {
    const segments = readDocumentSegments(document.master.body);
    const values: Record<string, string> = {};
    const allowed = inputKeys(segments);
    for (const entry of document.values) {
        if (allowed.has(entry.key)) values[entry.key] = entry.value;
    }
    const submission = document.engagement.questionnaireSubmission;
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
        id: document.id,
        engagementId: document.engagementId,
        masterId: document.masterId,
        name: document.master.name,
        kind: document.master.kind,
        segments,
        document: readStyledDocument(document.master.body),
        values: resolveCurrentDateValues(readStyledDocument(document.master.body), values),
        unmatchedAnswers,
        questionnaireAnswers:
            submission?.status === "completed"
                ? unmatchedQuestionnaireAnswers([], {}, submission.answers, matchFields)
                : [],
        masterRevision: document.master.revision,
        matchedMasterRevision: document.matchedMasterRevision,
        questionnaireCompleted: submission?.status === "completed",
    };
}

async function assertEngagement(params: Scope) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: params.engagementId,
            workerId: params.workerId,
            organizationId: params.organizationId,
        },
        select: { id: true },
    });
    if (!engagement) throw new AppError(NOT_FOUND, "Engagement nicht gefunden.");
}

function reload(id: string, db: Prisma.TransactionClient | typeof prisma = prisma) {
    return db.engagementTemplateDocument.findFirstOrThrow({
        where: { id },
        include: documentInclude,
    });
}

async function load(params: Scope & { documentId: string }) {
    return prisma.engagementTemplateDocument.findFirst({
        where: {
            id: params.documentId,
            engagementId: params.engagementId,
            engagement: {
                workerId: params.workerId,
                organizationId: params.organizationId,
            },
        },
        include: documentInclude,
    });
}

export async function listEngagementTemplateDocuments(params: Scope) {
    await assertEngagement(params);
    const rows = await prisma.engagementTemplateDocument.findMany({
        where: { engagementId: params.engagementId },
        include: { master: { select: { name: true, kind: true } } },
        orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({
        id: row.id,
        engagementId: row.engagementId,
        masterId: row.masterId,
        name: row.master.name,
        kind: row.master.kind,
    }));
}

export async function createEngagementTemplateDocument(
    params: Scope & { masterId: string },
) {
    await assertEngagement(params);
    const master = await prisma.documentMaster.findFirst({
        where: {
            id: params.masterId,
            organizationId: params.organizationId,
            deletedAt: null,
        },
        select: { id: true, kind: true },
    });
    if (!master) throw new AppError(NOT_FOUND, "Vorlage nicht gefunden.");

    const existing = await prisma.engagementTemplateDocument.findFirst({
        where: { engagementId: params.engagementId, masterId: master.id },
        include: documentInclude,
    });
    if (existing) return { document: present(existing), created: false };

    try {
        const created = await prisma.engagementTemplateDocument.create({
            data: { engagementId: params.engagementId, masterId: master.id },
            include: documentInclude,
        });
        return { document: present(created), created: true };
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            const raced = await prisma.engagementTemplateDocument.findFirst({
                where: { engagementId: params.engagementId, masterId: master.id },
                include: documentInclude,
            });
            if (raced) return { document: present(raced), created: false };
        }
        throw error;
    }
}

export async function getEngagementTemplateDocument(
    params: Scope & { documentId: string },
) {
    const document = await load(params);
    if (!document) throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    return present(document);
}

async function writeValues(
    document: StoredDocument,
    values: Record<string, unknown>,
    matchedMasterRevision?: number,
) {
    const segments = readDocumentSegments(document.master.body);
    const entries = readDraftValues(values, inputKeys(segments));
    const saved = await prisma.$transaction(async (tx) => {
        const latest = await tx.engagementTemplateDocument.findUnique({
            where: { id: document.id },
            select: { masterId: true },
        });
        if (!latest || latest.masterId !== document.masterId) {
            throw new AppError(BAD_REQUEST, "Die Vorlage wurde inzwischen geändert.");
        }
        await tx.engagementTemplateDocumentValue.deleteMany({
            where: { documentId: document.id },
        });
        if (entries.length > 0) {
            await tx.engagementTemplateDocumentValue.createMany({
                data: entries.map((entry) => ({
                    documentId: document.id,
                    key: entry.key,
                    value: entry.value,
                })),
            });
        }
        if (matchedMasterRevision !== undefined) {
            await tx.engagementTemplateDocument.update({
                where: { id: document.id },
                data: { matchedMasterRevision },
            });
        }
        return reload(document.id, tx);
    });
    return present(saved);
}

export async function saveEngagementTemplateDocument(
    params: Scope & { documentId: string; values: Record<string, unknown> },
) {
    const document = await load(params);
    if (!document) throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    return writeValues(document, params.values);
}

export async function syncEngagementTemplateDocument(
    params: Scope & { documentId: string },
) {
    const document = await load(params);
    if (!document) throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    const submission = document.engagement.questionnaireSubmission;
    if (!submission || submission.status !== "completed") {
        throw new AppError(BAD_REQUEST, "Der Fragebogen ist noch nicht ausgefüllt.");
    }

    const segments = readDocumentSegments(document.master.body);
    const answers = questionnaireAnswersFromStored(submission.answers);
    const matched = await matchQuestionnaireToContract(
        segments,
        answers,
        document.engagement.worker.email ?? "",
        matchFieldsFrom(submission.formDefinition),
    );
    const pointKeys = new Set(
        segments.flatMap((segment) =>
            segment.type === "input" && segment.fieldType === "points"
                ? [segment.key]
                : [],
        ),
    );
    const preserved = document.values.filter(
        (entry) => pointKeys.has(entry.key) && entry.value.trim().length > 0,
    );
    const values = Object.fromEntries([
        ...matched
            .filter((entry) => !pointKeys.has(entry.key))
            .map((entry) => [entry.key, entry.value]),
        ...preserved.map((entry) => [entry.key, entry.value]),
    ]);

    return writeValues(document, values, document.master.revision);
}

function pdfFilename(name: string) {
    const cleaned = name.replace(/[^\w.\- ()äöüÄÖÜß]+/g, " ").trim() || "Dokument";
    return `${cleaned}.pdf`;
}

export async function printEngagementTemplateDocument(
    params: Scope & {
        documentId: string;
        values?: Record<string, unknown>;
    },
) {
    const current = await load(params);
    if (!current) throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    const saved = params.values
        ? await writeValues(current, params.values)
        : present(current);
    const fresh = await load(params);
    if (!fresh) throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");

    const styled = parseStyledDocument(fresh.master.body);
    let values: Record<string, string>;
    try {
        values = validateFieldValues(styled, saved.values, false);
    } catch (error) {
        throw new AppError(BAD_REQUEST, (error as Error).message);
    }
    const pdf = await generateDocumentPdf(styled, values);
    return { bytes: pdf.bytes, filename: pdfFilename(fresh.master.name) };
}
