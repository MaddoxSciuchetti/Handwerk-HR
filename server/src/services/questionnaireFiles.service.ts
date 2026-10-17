import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import {
    encodeFileAnswer,
    fileAnswerForSubmission,
    questionnaireFileName,
    readFileAnswer,
    type QuestionnaireAnswers,
    type QuestionnaireField,
} from "@/services/questionnaireForm";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";

type FileStore = Prisma.TransactionClient | typeof prisma;

function answerValue(answers: QuestionnaireAnswers, key: string) {
    const value = (answers as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
}

export async function fileQuestionnaireAnswers(
    db: FileStore,
    params: {
        engagementId: string;
        submissionId: string;
        uploadedByUserId: string;
        fields: readonly QuestionnaireField[];
        answers: QuestionnaireAnswers;
    },
) {
    for (const field of params.fields) {
        if (field.type !== "file") continue;
        const file = fileAnswerForSubmission(
            answerValue(params.answers, field.key),
            params.submissionId,
        );
        if (!file) continue;
        await fileStoredAnswer(db, {
            engagementId: params.engagementId,
            uploadedByUserId: params.uploadedByUserId,
            file,
        });
    }
}

async function fileStoredAnswer(
    db: FileStore,
    params: {
        engagementId: string;
        uploadedByUserId: string;
        file: { name: string; key: string; mime?: string; size?: number };
    },
) {
    const existing = await db.engagementPersonnelDocument.findFirst({
        where: {
            engagementId: params.engagementId,
            fileUrl: params.file.key,
        },
        select: { id: true, originalFileName: true },
    });
    if (existing) {
        if (existing.originalFileName === params.file.name) return existing;
        return db.engagementPersonnelDocument.update({
            where: { id: existing.id },
            data: { originalFileName: params.file.name },
        });
    }
    return db.engagementPersonnelDocument.create({
        data: {
            engagementId: params.engagementId,
            uploadedByUserId: params.uploadedByUserId,
            name: "fragebogen",
            originalFileName: params.file.name,
            fileUrl: params.file.key,
            mimeType: params.file.mime ?? null,
            fileSizeBytes: params.file.size ?? null,
        },
    });
}

async function completedSubmission(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
}) {
    const submission = await prisma.questionnaireSubmission.findFirst({
        where: {
            engagementId: params.engagementId,
            status: "completed",
            engagement: {
                workerId: params.workerId,
                organizationId: params.organizationId,
            },
        },
        select: {
            id: true,
            engagementId: true,
            answers: { select: { id: true, key: true, value: true } },
        },
    });
    if (!submission) {
        throw new AppError(NOT_FOUND, "Ausgefüllter Fragebogen nicht gefunden.");
    }
    return submission;
}

export async function filedQuestionnaireKeys(engagementId: string, keys: string[]) {
    if (keys.length === 0) return new Set<string>();
    const rows = await prisma.engagementPersonnelDocument.findMany({
        where: { engagementId, fileUrl: { in: keys } },
        select: { fileUrl: true },
    });
    return new Set(rows.map((row) => row.fileUrl));
}

export async function fileCompletedQuestionnaire(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    uploadedByUserId: string;
    questionKey?: string;
}) {
    const submission = await completedSubmission(params);
    const answers = submission.answers.filter((answer) => {
        if (params.questionKey && answer.key !== params.questionKey) return false;
        return Boolean(fileAnswerForSubmission(answer.value, submission.id));
    });
    if (params.questionKey && answers.length === 0) {
        throw new AppError(BAD_REQUEST, "Diese Frage hat keine Datei.");
    }
    for (const answer of answers) {
        const file = fileAnswerForSubmission(answer.value, submission.id);
        if (!file) continue;
        await fileStoredAnswer(prisma, {
            engagementId: submission.engagementId,
            uploadedByUserId: params.uploadedByUserId,
            file,
        });
    }
}

export async function renameQuestionnaireFile(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    questionKey: string;
    name: string;
}) {
    const name = questionnaireFileName(params.name);
    if (!name) throw new AppError(BAD_REQUEST, "Der Dateiname fehlt.");
    const submission = await completedSubmission(params);
    const answer = submission.answers.find((item) => item.key === params.questionKey);
    const file = answer ? readFileAnswer(answer.value) : null;
    if (!answer || !file || !file.key.startsWith(`questionnaires/${submission.id}/`)) {
        throw new AppError(BAD_REQUEST, "Diese Frage hat keine Datei.");
    }
    const value = encodeFileAnswer(name, file.key, { mime: file.mime, size: file.size });
    await prisma.$transaction([
        prisma.questionnaireAnswer.update({
            where: { id: answer.id },
            data: { value },
        }),
        prisma.engagementPersonnelDocument.updateMany({
            where: { engagementId: submission.engagementId, fileUrl: file.key },
            data: { originalFileName: name },
        }),
    ]);
    return { name };
}
