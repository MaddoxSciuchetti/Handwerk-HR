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

function toDetail(master: {
    id: string;
    name: string;
    kind: DocumentMasterKind;
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

export async function listDocumentMasters(
    organizationId: string,
): Promise<DocumentMasterListItem[]> {
    return prisma.documentMaster.findMany({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            name: true,
            kind: true,
            updatedAt: true,
        },
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
    const created = await prisma.documentMaster.create({
        data: {
            organizationId: params.organizationId,
            kind: asKind(params.kind),
            name: params.name,
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
