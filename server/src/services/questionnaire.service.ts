import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { matchQuestionnaireToContract } from "@/services/contractFieldMatchAi";
import { readDocumentSegments } from "@/services/documentBody";
import { persistMatchedContractValues } from "@/services/employmentContract.service";
import {
    flattenQuestionnaireAnswers,
    QUESTIONNAIRE_FIELDS,
    QUESTIONNAIRE_INTRO,
    QUESTIONNAIRE_REPEATERS,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";
import AppError from "@/utils/AppError";

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
        intro: QUESTIONNAIRE_INTRO,
        questions: QUESTIONNAIRE_FIELDS,
        repeaters: QUESTIONNAIRE_REPEATERS,
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

    const contract = submission.engagement.employmentContract;
    const matched =
        contract?.status === "draft"
            ? await matchQuestionnaireToContract(
                  readDocumentSegments(contract.master.body),
                  answers,
                  submission.engagement.worker.email ?? "",
              )
            : null;

    await prisma.$transaction(async (tx) => {
        const claimed = await tx.questionnaireSubmission.updateMany({
            where: { id: submission.id, status: "sent" },
            data: { status: "completed", completedAt: new Date() },
        });
        if (claimed.count === 0) return;

        await tx.questionnaireAnswer.createMany({
            data: flattenQuestionnaireAnswers(answers).map((answer) => ({
                submissionId: submission.id,
                key: answer.key,
                value: answer.value,
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

        if (contract?.status === "draft" && matched) {
            await persistMatchedContractValues(tx, {
                contractId: contract.id,
                entries: matched,
                masterRevision: contract.master.revision,
            });
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
