import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { contractValuesFromAnswers } from "@/services/contractFieldMatch";
import { readDocumentSegments } from "@/services/documentBody";
import {
    QUESTIONNAIRE_FIELDS,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";

const HOSE = "Hose";
const TSHIRT = "T-Shirt";
const CONTRACT_TASK_TITLE = "Arbeitsvertrag versenden";
const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;

function parseBirthday(value: string) {
    if (!birthdayRegex.test(value)) {
        throw new AppError(BAD_REQUEST, "Das Geburtsdatum ist ungültig.");
    }
    const birthday = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(birthday.getTime())) {
        throw new AppError(BAD_REQUEST, "Das Geburtsdatum ist ungültig.");
    }
    return birthday;
}

async function upsertWorkwear(
    tx: Prisma.TransactionClient,
    workerId: string,
    itemName: string,
    size: string,
) {
    const existing = await tx.workerWorkwear.findFirst({
        where: { workerId, itemName },
    });
    if (existing) {
        await tx.workerWorkwear.update({
            where: { id: existing.id },
            data: { size },
        });
        return;
    }
    await tx.workerWorkwear.create({
        data: {
            workerId,
            itemName,
            size,
            articleNumber: "",
            quantity: 1,
        },
    });
}

export async function getPublicQuestionnaire(token: string) {
    const submission = await prisma.questionnaireSubmission.findUnique({
        where: { token },
        select: { status: true },
    });
    if (!submission) return null;
    if (submission.status !== "sent") {
        return { status: "completed" as const };
    }
    return {
        status: "sent" as const,
        questions: QUESTIONNAIRE_FIELDS,
    };
}

export async function submitPublicQuestionnaire(
    token: string,
    answers: QuestionnaireAnswers,
) {
    const birthday = parseBirthday(answers.birthday);
    const submission = await prisma.questionnaireSubmission.findUnique({
        where: { token },
        include: {
            engagement: {
                include: {
                    worker: true,
                    employmentContract: { include: { master: true } },
                },
            },
        },
    });
    if (!submission) {
        throw new AppError(NOT_FOUND, "Formular nicht gefunden.");
    }
    if (submission.status !== "sent") {
        return { status: "completed" as const };
    }

    await prisma.$transaction(async (tx) => {
        const claimed = await tx.questionnaireSubmission.updateMany({
            where: { id: submission.id, status: "sent" },
            data: { status: "completed", completedAt: new Date() },
        });
        if (claimed.count === 0) return;

        await tx.questionnaireAnswer.createMany({
            data: QUESTIONNAIRE_FIELDS.map((field) => ({
                submissionId: submission.id,
                key: field.key,
                value: answers[field.key],
            })),
        });

        await tx.worker.update({
            where: { id: submission.engagement.workerId },
            data: {
                firstName: answers.firstName,
                lastName: answers.lastName,
                street: answers.street,
                postalCode: answers.postalCode,
                city: answers.city,
                birthday,
            },
        });

        await upsertWorkwear(tx, submission.engagement.workerId, HOSE, answers.trouserSize);
        await upsertWorkwear(
            tx,
            submission.engagement.workerId,
            TSHIRT,
            answers.tshirtSize,
        );

        const contract = submission.engagement.employmentContract;
        if (contract?.status === "draft") {
            const entries = contractValuesFromAnswers(
                readDocumentSegments(contract.master.body),
                answers,
                submission.engagement.worker.email,
            );
            for (const entry of entries) {
                await tx.employmentContractValue.upsert({
                    where: {
                        employmentContractId_key: {
                            employmentContractId: contract.id,
                            key: entry.key,
                        },
                    },
                    create: {
                        employmentContractId: contract.id,
                        key: entry.key,
                        value: entry.value,
                    },
                    update: { value: entry.value },
                });
            }
        }

        await tx.issue.updateMany({
            where: {
                workerEngagementId: submission.engagementId,
                title: "Fragebogen",
                status: { not: "done" },
            },
            data: { status: "done" },
        });

        if (contract) {
            await tx.issue.create({
                data: {
                    workerEngagementId: submission.engagementId,
                    createdByUserId: submission.engagement.responsibleUserId,
                    assigneeUserId: submission.engagement.responsibleUserId,
                    status: "in_progress",
                    kind: "contract_send",
                    isTemporary: true,
                    title: CONTRACT_TASK_TITLE,
                },
            });
        }
    });

    return { status: "completed" as const };
}
