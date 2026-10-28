import { generatePresignedUrl, uploadFileToS3 } from "@/config/aws";
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { personnelFolderLabel } from "@/services/personnelFolderLabel";
import {
    isAssignablePersonnelDocumentName,
    personnelDocumentLabel,
    type PersonnelDocumentName,
} from "@/services/personnelDocumentNames";
import {
    encodeFileAnswer,
    questionnaireFileName,
    readFileAnswer,
} from "@/services/questionnaireForm";
import AppError from "@/utils/AppError";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Prisma } from "@prisma/client";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export type PersonnelDocumentDto = {
    id: string;
    engagementId: string;
    folderId: string | null;
    name: PersonnelDocumentName;
    label: string;
    originalFileName: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    createdAt: Date;
    presignedUrl: string;
};

export type PersonnelFolderDto = {
    id: string;
    engagementId: string;
    label: string;
};

async function storedDocumentName(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    name: string;
    folderId?: string;
}): Promise<{ name: PersonnelDocumentName; folderId: string | null }> {
    if (params.folderId) {
        const folder = await prisma.engagementPersonnelFolder.findFirst({
            where: {
                id: params.folderId,
                engagementId: params.engagementId,
                engagement: {
                    workerId: params.workerId,
                    organizationId: params.organizationId,
                },
            },
            select: { id: true },
        });
        if (!folder) throw new AppError(NOT_FOUND, "Ordner nicht gefunden.");
        return { name: "ordner", folderId: folder.id };
    }
    if (!isAssignablePersonnelDocumentName(params.name)) {
        throw new AppError(
            BAD_REQUEST,
            "Wähle Personalausweis, Führerschein oder Krankenkassenkarte.",
        );
    }
    return { name: params.name, folderId: null };
}

function originalName(file: Express.Multer.File): string {
    const base = file.originalname.split(/[/\\]/).pop()?.trim() ?? "";
    return (base || "datei").slice(0, 255);
}

async function requireEngagement(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
}) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: params.engagementId,
            workerId: params.workerId,
            organizationId: params.organizationId,
        },
        select: { id: true },
    });
    if (!engagement) {
        throw new AppError(NOT_FOUND, "Engagement nicht gefunden.");
    }
    return engagement;
}

async function toDto(document: {
    id: string;
    engagementId: string;
    folderId: string | null;
    name: PersonnelDocumentName;
    originalFileName: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    createdAt: Date;
    fileUrl: string;
    folder: { label: string } | null;
}): Promise<PersonnelDocumentDto> {
    return {
        id: document.id,
        engagementId: document.engagementId,
        folderId: document.folderId,
        name: document.name,
        label: document.folder?.label ?? personnelDocumentLabel(document.name),
        originalFileName: document.originalFileName,
        mimeType: document.mimeType,
        fileSizeBytes: document.fileSizeBytes,
        createdAt: document.createdAt,
        presignedUrl: await generatePresignedUrl(document.fileUrl),
    };
}

export async function listPersonnelDocuments(params: {
    organizationId: string;
    workerId: string;
}): Promise<{
    documents: PersonnelDocumentDto[];
    folders: PersonnelFolderDto[];
    hiddenFolders: string[];
}> {
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: { id: true, hiddenPersonnelFolders: true },
    });
    if (!worker) throw new AppError(NOT_FOUND, "Mitarbeiter nicht gefunden.");

    const [documents, folders] = await Promise.all([
        prisma.engagementPersonnelDocument.findMany({
            where: {
                engagement: {
                    workerId: params.workerId,
                    organizationId: params.organizationId,
                },
            },
            include: { folder: { select: { label: true } } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.engagementPersonnelFolder.findMany({
            where: {
                engagement: {
                    workerId: params.workerId,
                    organizationId: params.organizationId,
                },
            },
            select: { id: true, engagementId: true, label: true },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    return {
        documents: await Promise.all(
            documents.map((document) => toDto(document)),
        ),
        folders,
        hiddenFolders: worker.hiddenPersonnelFolders,
    };
}

export async function createPersonnelFolder(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    label: string;
}): Promise<PersonnelFolderDto> {
    const label = personnelFolderLabel(params.label);
    await requireEngagement(params);
    const existing = await prisma.engagementPersonnelFolder.findFirst({
        where: {
            engagementId: params.engagementId,
            label: { equals: label, mode: "insensitive" },
        },
        select: { id: true },
    });
    if (existing) {
        throw new AppError(CONFLICT, "Dieser Ordner existiert bereits.");
    }
    try {
        return await prisma.engagementPersonnelFolder.create({
            data: { engagementId: params.engagementId, label },
            select: { id: true, engagementId: true, label: true },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new AppError(CONFLICT, "Dieser Ordner existiert bereits.");
        }
        throw error;
    }
}

export async function uploadPersonnelDocument(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    uploadedByUserId: string;
    name: string;
    folderId?: string;
    file: Express.Multer.File;
}): Promise<PersonnelDocumentDto> {
    if (!params.file?.buffer?.length) {
        throw new AppError(BAD_REQUEST, "Datei fehlt.");
    }

    await requireEngagement(params);
    const stored = await storedDocumentName(params);

    const upload = await uploadFileToS3(
        params.file,
        params.engagementId,
        "upload/personnel-documents",
    );
    if (!upload.success || !upload.key) {
        throw new AppError(
            BAD_REQUEST,
            upload.error ?? "Hochladen ist fehlgeschlagen.",
        );
    }

    const created = await prisma.engagementPersonnelDocument.create({
        data: {
            engagementId: params.engagementId,
            folderId: stored.folderId,
            uploadedByUserId: params.uploadedByUserId,
            name: stored.name,
            originalFileName: originalName(params.file),
            fileUrl: upload.key,
            mimeType: params.file.mimetype?.slice(0, 128) || null,
            fileSizeBytes: params.file.size,
        },
        include: { folder: { select: { label: true } } },
    });

    return toDto(created);
}

export async function renamePersonnelDocument(params: {
    organizationId: string;
    workerId: string;
    documentId: string;
    name: string;
}) {
    const name = questionnaireFileName(params.name);
    if (!name) throw new AppError(BAD_REQUEST, "Der Dateiname fehlt.");
    const document = await prisma.engagementPersonnelDocument.findFirst({
        where: {
            id: params.documentId,
            engagement: {
                workerId: params.workerId,
                organizationId: params.organizationId,
            },
        },
    });
    if (!document) throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
    await prisma.$transaction(async (tx) => {
        await tx.engagementPersonnelDocument.update({
            where: { id: document.id },
            data: { originalFileName: name },
        });
        const answers = await tx.questionnaireAnswer.findMany({
            where: {
                value: { contains: document.fileUrl },
                submission: {
                    engagement: {
                        workerId: params.workerId,
                        organizationId: params.organizationId,
                    },
                },
            },
        });
        for (const answer of answers) {
            const file = readFileAnswer(answer.value);
            if (!file || file.key !== document.fileUrl) continue;
            await tx.questionnaireAnswer.update({
                where: { id: answer.id },
                data: {
                    value: encodeFileAnswer(name, file.key, {
                        mime: file.mime,
                        size: file.size,
                    }),
                },
            });
        }
    });
    return { name };
}

export async function deletePersonnelDocument(params: {
    organizationId: string;
    workerId: string;
    documentId: string;
}) {
    const document = await prisma.engagementPersonnelDocument.findFirst({
        where: {
            id: params.documentId,
            engagement: {
                workerId: params.workerId,
                organizationId: params.organizationId,
            },
        },
    });
    if (!document) throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");

    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: document.fileUrl,
            }),
        );
    } catch (error) {
        console.error("S3 delete failed for key", document.fileUrl, error);
    }

    await prisma.engagementPersonnelDocument.delete({
        where: { id: document.id },
    });
}

export async function movePersonnelDocument(params: {
    organizationId: string;
    workerId: string;
    documentId: string;
    engagementId: string;
    name: string;
    folderId?: string;
    source?: string;
}) {
    await requireEngagement(params);
    const stored = await storedDocumentName(params);
    const scope = {
        workerId: params.workerId,
        organizationId: params.organizationId,
    };
    await prisma.$transaction(async (tx) => {
        if (params.source === "worker") {
            const document = await tx.workerDocument.findFirst({
                where: { id: params.documentId, worker: scope },
            });
            if (!document)
                throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
            await tx.engagementPersonnelDocument.create({
                data: {
                    engagementId: params.engagementId,
                    ...stored,
                    uploadedByUserId: document.uploadedByUserId,
                    originalFileName: document.name,
                    fileUrl: document.fileUrl,
                    mimeType: document.mimeType,
                    fileSizeBytes: document.fileSizeBytes,
                    createdAt: document.createdAt,
                },
            });
            await tx.workerDocument.delete({ where: { id: document.id } });
        } else {
            const document = await tx.engagementPersonnelDocument.findFirst({
                where: { id: params.documentId, engagement: scope },
            });
            if (!document)
                throw new AppError(NOT_FOUND, "Dokument nicht gefunden.");
            await tx.engagementPersonnelDocument.update({
                where: { id: document.id },
                data: { ...stored, engagementId: params.engagementId },
            });
        }
    });
}

export async function deletePersonnelFolder(params: {
    organizationId: string;
    workerId: string;
    folderId: string;
    confirmed: boolean;
}) {
    const scope = {
        workerId: params.workerId,
        organizationId: params.organizationId,
    };
    const builtin = params.folderId.startsWith("builtin:")
        ? params.folderId.slice(8)
        : null;
    if (builtin && !isAssignablePersonnelDocumentName(builtin)) {
        throw new AppError(BAD_REQUEST, "Ungültiger Ordner.");
    }
    const documents = await prisma.$transaction(async (tx) => {
        const worker = await tx.worker.findFirst({
            where: {
                id: params.workerId,
                organizationId: params.organizationId,
            },
        });
        if (!worker)
            throw new AppError(NOT_FOUND, "Mitarbeiter nicht gefunden.");
        const folder = builtin
            ? null
            : await tx.engagementPersonnelFolder.findFirst({
                  where: { id: params.folderId, engagement: scope },
              });
        if (!builtin && !folder)
            throw new AppError(NOT_FOUND, "Ordner nicht gefunden.");
        const where = {
            engagement: scope,
            ...(builtin
                ? { folderId: null, name: builtin as PersonnelDocumentName }
                : { folderId: params.folderId }),
        };
        const contents = await tx.engagementPersonnelDocument.findMany({
            where,
        });
        if (contents.length && !params.confirmed) {
            throw new AppError(
                CONFLICT,
                "Der Ordner enthält Dateien. Bitte das Löschen bestätigen.",
            );
        }
        await tx.engagementPersonnelDocument.deleteMany({ where });
        if (builtin) {
            await tx.worker.update({
                where: { id: worker.id },
                data: { hiddenPersonnelFolders: { push: builtin } },
            });
        } else {
            await tx.engagementPersonnelFolder.delete({
                where: { id: params.folderId },
            });
        }
        return contents;
    });
    for (const document of documents) {
        try {
            await s3.send(
                new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET!,
                    Key: document.fileUrl,
                }),
            );
        } catch (error) {
            console.error("S3 delete failed for key", document.fileUrl, error);
        }
    }
}
