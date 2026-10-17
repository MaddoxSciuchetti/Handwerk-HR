import { generatePresignedUrl, uploadFileToS3 } from "@/config/aws";
import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import {
    isPersonnelDocumentName,
    personnelDocumentLabel,
    type PersonnelDocumentName,
} from "@/services/personnelDocumentNames";
import { encodeFileAnswer, questionnaireFileName, readFileAnswer } from "@/services/questionnaireForm";
import AppError from "@/utils/AppError";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export type PersonnelDocumentDto = {
    id: string;
    engagementId: string;
    name: PersonnelDocumentName;
    label: string;
    originalFileName: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    createdAt: Date;
    presignedUrl: string;
};

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
    name: PersonnelDocumentName;
    originalFileName: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    createdAt: Date;
    fileUrl: string;
}): Promise<PersonnelDocumentDto> {
    return {
        id: document.id,
        engagementId: document.engagementId,
        name: document.name,
        label: personnelDocumentLabel(document.name),
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
}): Promise<PersonnelDocumentDto[]> {
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: { id: true },
    });
    if (!worker) throw new AppError(NOT_FOUND, "Mitarbeiter nicht gefunden.");

    const documents = await prisma.engagementPersonnelDocument.findMany({
        where: {
            engagement: {
                workerId: params.workerId,
                organizationId: params.organizationId,
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return Promise.all(documents.map((document) => toDto(document)));
}

export async function uploadPersonnelDocument(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    uploadedByUserId: string;
    name: string;
    file: Express.Multer.File;
}): Promise<PersonnelDocumentDto> {
    if (!isPersonnelDocumentName(params.name)) {
        throw new AppError(
            BAD_REQUEST,
            "Wähle Personalausweis, Führerschein oder Krankenkassenkarte.",
        );
    }
    if (!params.file?.buffer?.length) {
        throw new AppError(BAD_REQUEST, "Datei fehlt.");
    }

    await requireEngagement(params);

    const upload = await uploadFileToS3(
        params.file,
        params.engagementId,
        "upload/personnel-documents",
    );
    if (!upload.success || !upload.key) {
        throw new AppError(BAD_REQUEST, upload.error ?? "Hochladen ist fehlgeschlagen.");
    }

    const created = await prisma.engagementPersonnelDocument.create({
        data: {
            engagementId: params.engagementId,
            uploadedByUserId: params.uploadedByUserId,
            name: params.name,
            originalFileName: originalName(params.file),
            fileUrl: upload.key,
            mimeType: params.file.mimetype?.slice(0, 128) || null,
            fileSizeBytes: params.file.size,
        },
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
                submission: { engagementId: document.engagementId },
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
