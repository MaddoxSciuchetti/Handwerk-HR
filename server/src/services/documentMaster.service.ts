import { BAD_REQUEST, NOT_FOUND, CONFLICT } from "@/constants/http";
import { generatePresignedUrl } from "@/config/aws";
import {
    readStyledDocument,
    type StyledDocument,
} from "../../../shared/document";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";
import { DocumentMasterKind, Prisma } from "@prisma/client";
import {
    documentBody,
    DocumentSegment,
    readDocumentSegments,
    segmentsFromText,
    textFromSegments,
} from "./documentBody";

const KINDS = new Set<string>([
    DocumentMasterKind.employment_contract,
    DocumentMasterKind.arbeitszeugnis,
]);

export type DocumentMasterListItem = {
    id: string;
    name: string;
    kind: DocumentMasterKind;
    isPrimary: boolean;
    updatedAt: Date;
};

export type DocumentMasterDetail = DocumentMasterListItem & {
    text: string;
    segments: DocumentSegment[];
    document: StyledDocument;
    revision: number;
    approvedAt: Date | null;
    sourceUrl?: string | null;
    sourceMime?: string | null;
    importWarnings?: string[];
};

function asKind(kind: string): DocumentMasterKind {
    if (!KINDS.has(kind)) {
        throw new AppError(BAD_REQUEST, "Unbekannte Dokumentart.");
    }
    return kind as DocumentMasterKind;
}

const masterSelect = {
    id: true,
    name: true,
    kind: true,
    isPrimary: true,
    updatedAt: true,
} as const;

function toDetail(master: {
    id: string;
    name: string;
    kind: DocumentMasterKind;
    isPrimary: boolean;
    body: Parameters<typeof readDocumentSegments>[0];
    updatedAt: Date;
    revision: number;
    approvedAt: Date | null;
    sourceMime?: string | null;
}): DocumentMasterDetail {
    const segments = readDocumentSegments(master.body);
    return {
        id: master.id,
        name: master.name,
        kind: master.kind,
        isPrimary: master.isPrimary,
        text: textFromSegments(segments),
        segments,
        updatedAt: master.updatedAt,
        document: readStyledDocument(master.body),
        revision: master.revision,
        approvedAt: master.approvedAt,
        sourceMime: master.sourceMime,
        importWarnings: readStyledDocument(master.body).importWarnings,
    };
}

export async function primaryEmploymentContract(
    organizationId: string,
    db: Prisma.TransactionClient | typeof prisma = prisma,
) {
    const marked = await db.documentMaster.findFirst({
        where: {
            organizationId,
            kind: DocumentMasterKind.employment_contract,
            isPrimary: true,
        },
    });
    if (marked) return marked;
    return db.documentMaster.findFirst({
        where: {
            organizationId,
            kind: DocumentMasterKind.employment_contract,
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function listDocumentMasters(
    organizationId: string,
): Promise<DocumentMasterListItem[]> {
    return prisma.documentMaster.findMany({
        where: { organizationId },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        select: masterSelect,
    });
}

export async function createDocumentMaster(params: {
    organizationId: string;
    kind: string;
    name: string;
    text?: string;
    document?: StyledDocument;
    sourceKey?: string;
    sourceMime?: string;
    sourceName?: string;
}): Promise<DocumentMasterDetail> {
    const kind = asKind(params.kind);
    const marked = await prisma.documentMaster.findFirst({
        where: {
            organizationId: params.organizationId,
            kind: DocumentMasterKind.employment_contract,
            isPrimary: true,
        },
        select: { id: true },
    });
    const created = await prisma.documentMaster.create({
        data: {
            organizationId: params.organizationId,
            kind,
            name: params.name,
            isPrimary:
                kind === DocumentMasterKind.employment_contract && !marked,
            body: (params.document ??
                documentBody(
                    segmentsFromText(params.text ?? ""),
                )) as Prisma.InputJsonValue,
            sourceKey: params.sourceKey,
            sourceMime: params.sourceMime,
            sourceName: params.sourceName,
        },
        select: {
            id: true,
            name: true,
            kind: true,
            isPrimary: true,
            body: true,
            revision: true,
            approvedAt: true,
            sourceMime: true,
            updatedAt: true,
        },
    });

    return toDetail(created);
}

export async function getDocumentMaster(
    id: string,
    organizationId: string,
): Promise<DocumentMasterDetail> {
    const master = await prisma.documentMaster.findFirst({
        where: { id, organizationId },
        select: {
            id: true,
            name: true,
            kind: true,
            isPrimary: true,
            body: true,
            revision: true,
            approvedAt: true,
            sourceKey: true,
            sourceMime: true,
            updatedAt: true,
        },
    });

    if (!master) {
        throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    }

    return {
        ...toDetail(master),
        sourceUrl: master.sourceKey
            ? await generatePresignedUrl(master.sourceKey)
            : null,
    };
}

export async function updateDocumentMaster(params: {
    id: string;
    organizationId: string;
    name: string;
    segments?: DocumentSegment[];
    document?: StyledDocument;
    revision?: number;
    approved?: boolean;
}): Promise<DocumentMasterDetail> {
    const existing = await prisma.documentMaster.findFirst({
        where: { id: params.id, organizationId: params.organizationId },
        select: { id: true, revision: true },
    });

    if (!existing) {
        throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    }

    const result = await prisma.documentMaster.updateMany({
        where: {
            id: params.id,
            organizationId: params.organizationId,
            revision: params.revision ?? existing.revision,
        },
        data: {
            name: params.name,
            body: (params.document ??
                documentBody(params.segments ?? [])) as Prisma.InputJsonValue,
            revision: { increment: 1 },
            approvedAt: params.approved ? new Date() : null,
        },
    });
    if (!result.count)
        throw new AppError(
            CONFLICT,
            "Die Vorlage wurde inzwischen geändert. Bitte neu laden.",
        );
    return getDocumentMaster(params.id, params.organizationId);
}

export async function setPrimaryDocumentMaster(
    id: string,
    organizationId: string,
): Promise<DocumentMasterDetail> {
    const master = await prisma.documentMaster.findFirst({
        where: { id, organizationId },
        select: { id: true, kind: true, isPrimary: true },
    });
    if (!master) {
        throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    }
    if (master.kind !== DocumentMasterKind.employment_contract) {
        throw new AppError(
            BAD_REQUEST,
            "Nur ein Arbeitsvertrag kann die Versandvorlage sein.",
        );
    }
    if (master.isPrimary) return getDocumentMaster(id, organizationId);

    try {
        await prisma.$transaction(async (tx) => {
            await tx.documentMaster.updateMany({
                where: {
                    organizationId,
                    kind: DocumentMasterKind.employment_contract,
                    isPrimary: true,
                },
                data: { isPrimary: false },
            });
            await tx.documentMaster.update({
                where: { id: master.id },
                data: { isPrimary: true },
            });
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new AppError(
                CONFLICT,
                "Die Versandvorlage wurde gerade geändert. Bitte erneut versuchen.",
            );
        }
        throw error;
    }

    return getDocumentMaster(id, organizationId);
}

export async function deleteDocumentMaster(
    id: string,
    organizationId: string,
): Promise<void> {
    const master = await prisma.documentMaster.findFirst({
        where: { id, organizationId },
        select: { id: true },
    });
    if (!master) {
        throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    }

    const [contracts, certificates, settings] = await Promise.all([
        prisma.employmentContract.count({ where: { masterId: id } }),
        prisma.arbeitszeugnis.count({ where: { masterId: id } }),
        prisma.automationDocumentSetting.count({
            where: { documentMasterId: id },
        }),
    ]);
    if (contracts > 0 || certificates > 0 || settings > 0) {
        throw new AppError(
            CONFLICT,
            "Dieses Dokument wird noch verwendet und kann nicht gelöscht werden.",
        );
    }

    await prisma.documentMaster.delete({ where: { id: master.id } });
}
