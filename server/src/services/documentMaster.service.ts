import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";
import { DocumentMasterKind, Prisma } from "@prisma/client";

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
};

function asKind(kind: string): DocumentMasterKind {
    if (!KINDS.has(kind)) {
        throw new AppError(BAD_REQUEST, "Unbekannte Dokumentart.");
    }
    return kind as DocumentMasterKind;
}

function readText(body: Prisma.JsonValue): string {
    if (
        body !== null &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        "text" in body &&
        typeof body.text === "string"
    ) {
        return body.text;
    }
    return "";
}

function documentBody(text: string): Prisma.InputJsonValue {
    return { version: 1, text };
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
            body: documentBody(params.text),
        },
        select: {
            id: true,
            name: true,
            kind: true,
            body: true,
            updatedAt: true,
        },
    });

    return {
        id: created.id,
        name: created.name,
        kind: created.kind,
        text: readText(created.body),
        updatedAt: created.updatedAt,
    };
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

    return {
        id: master.id,
        name: master.name,
        kind: master.kind,
        text: readText(master.body),
        updatedAt: master.updatedAt,
    };
}

export async function updateDocumentMaster(params: {
    id: string;
    organizationId: string;
    name: string;
    text: string;
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
            body: documentBody(params.text),
        },
        select: {
            id: true,
            name: true,
            kind: true,
            body: true,
            updatedAt: true,
        },
    });

    return {
        id: updated.id,
        name: updated.name,
        kind: updated.kind,
        text: readText(updated.body),
        updatedAt: updated.updatedAt,
    };
}
