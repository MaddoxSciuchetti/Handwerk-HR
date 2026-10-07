import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";
import { DocumentMasterKind } from "@prisma/client";
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
}): DocumentMasterDetail {
    const segments = readDocumentSegments(master.body);
    return {
        id: master.id,
        name: master.name,
        kind: master.kind,
        text: textFromSegments(segments),
        segments,
        updatedAt: master.updatedAt,
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
    text: string;
}): Promise<DocumentMasterDetail> {
    const created = await prisma.documentMaster.create({
        data: {
            organizationId: params.organizationId,
            kind: asKind(params.kind),
            name: params.name,
            body: documentBody(segmentsFromText(params.text)),
        },
        select: {
            id: true,
            name: true,
            kind: true,
            body: true,
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
            updatedAt: true,
        },
    });

    if (!master) {
        throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    }

    return toDetail(master);
}

export async function updateDocumentMaster(params: {
    id: string;
    organizationId: string;
    name: string;
    segments: DocumentSegment[];
}): Promise<DocumentMasterDetail> {
    const existing = await prisma.documentMaster.findFirst({
        where: { id: params.id, organizationId: params.organizationId },
        select: { id: true },
    });

    if (!existing) {
        throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    }

    const updated = await prisma.documentMaster.update({
        where: { id: params.id },
        data: {
            name: params.name,
            body: documentBody(params.segments),
        },
        select: {
            id: true,
            name: true,
            kind: true,
            body: true,
            updatedAt: true,
        },
    });

    return toDetail(updated);
}
