import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { matchQuestionnaireToContract } from "@/services/contractFieldMatchAi";
import { readDocumentSegments } from "@/services/documentBody";
import { persistMatchedContractValues } from "@/services/employmentContract.service";
import {
    definitionFields,
    definitionRepeaters,
    parseQuestionnaireDefinition,
    isWorkerLocked,
    presentQuestions,
    type QuestionnaireDefinition,
    type QuestionnaireFieldItem,
} from "@/services/questionnaireDefinition";
import {
    flattenQuestionnaireAnswers,
    workerTextFromAnswers,
    QUESTIONNAIRE_FIELDS,
    QUESTIONNAIRE_INTRO,
    QUESTIONNAIRE_REPEATERS,
    questionnaireAnswerSchema,
    type QuestionnaireAnswers,
    type QuestionnaireField,
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

function storedDefinition(value: unknown): QuestionnaireDefinition | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    try {
        return parseQuestionnaireDefinition(value);
    } catch {
        return null;
    }
}

function publicPayload(definition: QuestionnaireDefinition | null) {
    if (!definition) {
        return {
            intro: QUESTIONNAIRE_INTRO,
            questions: QUESTIONNAIRE_FIELDS.map((field) => ({ ...field, required: true })),
            repeaters: QUESTIONNAIRE_REPEATERS,
        };
    }
    return {
        intro: definition.intro,
        questions: presentQuestions(definition),
        repeaters: definitionRepeaters(definition),
        items: definition.items.map((item) =>
            item.kind === "repeater"
                ? item
                : {
                      kind: "field" as const,
                      key: item.key,
                      label: item.label,
                      section: item.section,
                      type: item.type,
                      required: item.required,
                      options: item.options,
                      max: item.max,
                      layout: item.layout,
                      required: true,
                      employerFilled: isWorkerLocked(item),
                      defaultValue: item.defaultValue,
                  },
        ),
    };
}

export async function getPublicQuestionnaire(token: string) {
    const submission = await prisma.questionnaireSubmission.findUnique({
        where: { token },
        select: { status: true, formDefinition: true },
    });
    if (!submission) return null;
    if (submission.status !== "sent") {
        return { status: "completed" as const };
    }
    return {
        status: "sent" as const,
        ...publicPayload(storedDefinition(submission.formDefinition)),
    };
}

function fieldsOf(definition: QuestionnaireDefinition | null): QuestionnaireField[] {
    const fields = definition ? definitionFields(definition) : [...QUESTIONNAIRE_FIELDS];
    return fields.map((field) => ({ ...field, required: true }));
}

function lockEmployerValues(
    fields: Array<QuestionnaireField | QuestionnaireFieldItem>,
    body: unknown,
) {
    const answers =
        body && typeof body === "object" && !Array.isArray(body)
            ? { ...(body as Record<string, unknown>) }
            : {};
    for (const field of fields) {
        if (!isWorkerLocked(field)) continue;
        answers[field.key] = field.defaultValue ?? "";
    }
    return answers;
}

export async function submitPublicQuestionnaire(token: string, body: unknown) {
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

    const definition = storedDefinition(submission.formDefinition);
    const fields = fieldsOf(definition);
    const repeaterKeys = definition
        ? definitionRepeaters(definition).map((repeater) => repeater.key)
        : ["children", "priorEmployment"];
    const answers = questionnaireAnswerSchema(fields, repeaterKeys).parse(
        lockEmployerValues(fields, body),
    ) as QuestionnaireAnswers;
    const matchFields = fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        contractFieldKey:
            "contractFieldKey" in field && typeof field.contractFieldKey === "string"
                ? field.contractFieldKey
                : undefined,
    }));

    const contract = submission.engagement.employmentContract;
    const matched =
        contract?.status === "draft"
            ? await matchQuestionnaireToContract(
                  readDocumentSegments(contract.master.body),
                  answers,
                  submission.engagement.worker.email ?? "",
                  matchFields,
              )
            : null;

    await prisma.$transaction(async (tx) => {
        const claimed = await tx.questionnaireSubmission.updateMany({
            where: { id: submission.id, status: "sent" },
            data: { status: "completed", completedAt: new Date() },
        });
        if (claimed.count === 0) return;

        await tx.questionnaireAnswer.createMany({
            data: flattenQuestionnaireAnswers(answers, fields).map((answer) => ({
                submissionId: submission.id,
                key: answer.key,
                value: answer.value,
            })),
        });

        const workerFields = workerTextFromAnswers(fields, answers);
        const workerData = {
            ...workerFields.data,
            ...(workerFields.birthday
                ? { birthday: parseBirthday(workerFields.birthday) }
                : {}),
        };
        if (Object.keys(workerData).length > 0) {
            await tx.worker.update({
                where: { id: submission.engagement.workerId },
                data: workerData,
            });
        }

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
