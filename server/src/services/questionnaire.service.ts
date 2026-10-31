import { QUESTIONNAIRE_DECLARATION } from "../../../shared/questionnaireDeclaration";
import { uploadFileToS3 } from "@/config/aws";
import { QUESTIONNAIRE_MOCK_RESPONSES } from "@/constants/env";
import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { isStagingEnvironment } from "@/constants/stagingMail";
import { prisma } from "@/lib/prisma";
import { fileQuestionnaireAnswers } from "@/services/questionnaireFiles.service";
import { matchQuestionnaireToContract } from "@/services/contractFieldMatchAi";
import { readDocumentSegments } from "@/services/documentBody";
import { persistMatchedContractValues } from "@/services/employmentContract.service";
import {
    definitionFields,
    definitionRepeaters,
    parseQuestionnaireDefinition,
    fieldIsLocked,
    presentQuestions,
    questionRequired,
    type QuestionnaireDefinition,
} from "@/services/questionnaireDefinition";
import {
    encodeFileAnswer,
    fileAnswerForSubmission,
    flattenQuestionnaireAnswers,
    QUESTIONNAIRE_FIELDS,
    QUESTIONNAIRE_INTRO,
    QUESTIONNAIRE_REPEATERS,
    questionnaireAnswerSchema,
    type QuestionnaireAnswers,
    type QuestionnaireField,
} from "@/services/questionnaireForm";
import { clearUndistributedWeekdays } from "../../../shared/weeklyHours";
import { workerProfileFromQuestionnaire } from "@/services/questionnaireWorkerProfile";
import AppError from "@/utils/AppError";

const CONTRACT_TASK_TITLE = "Arbeitsvertrag drucken";

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
            name: "Personalfragebogen",
            intro: QUESTIONNAIRE_INTRO,
            questions: [...QUESTIONNAIRE_FIELDS.filter((field) => field.key !== "declaration").map((field) => ({ ...field, required: true })), QUESTIONNAIRE_DECLARATION],
            repeaters: QUESTIONNAIRE_REPEATERS,
        };
    }
    return {
        name: definition.name ?? "Personalfragebogen",
        intro: definition.intro,
        questions: [...presentQuestions(definition).filter((field) => field.key !== "declaration"), QUESTIONNAIRE_DECLARATION],
        repeaters: definitionRepeaters(definition),
        items: [...definition.items
            .filter((item) => item.key !== "declaration" && !item.omitFromWorker)
            .map((item) => {
                if (item.kind === "section") {
                    return {
                        kind: "section" as const,
                        key: item.key,
                        title: item.title,
                        optional: item.optional,
                    };
                }
                if (item.kind === "repeater") return item;
                return {
                    kind: "field" as const,
                    key: item.key,
                    label: item.label,
                    section: item.section,
                    type: item.type,
                    required: questionRequired(item) && !item.bsbOnly,
                    options: item.options,
                    max: item.max,
                    layout: item.layout,
                    employerFilled: fieldIsLocked(item),
                    bsbOnly: item.bsbOnly,
                    defaultValue: item.defaultValue,
                };
            }), { kind: "field" as const, ...QUESTIONNAIRE_DECLARATION, employerFilled: false }],
    };
}

function stagingFillEnabled() {
    return isStagingEnvironment() || QUESTIONNAIRE_MOCK_RESPONSES;
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
        staging: stagingFillEnabled(),
        ...publicPayload(storedDefinition(submission.formDefinition)),
    };
}

type ProfileQuestionField = QuestionnaireField & {
    defaultValue?: string;
    bsbOnly?: boolean;
    officeOnly?: boolean;
};

function fieldsOf(definition: QuestionnaireDefinition | null): ProfileQuestionField[] {
    const fields: ProfileQuestionField[] = definition ? definitionFields(definition) : [...QUESTIONNAIRE_FIELDS];
    return [
        ...fields
            .filter((field) => field.key !== "declaration")
            .map((field) => ({ ...field, required: questionRequired(field) && !field.bsbOnly })),
        QUESTIONNAIRE_DECLARATION,
    ];
}

function lockEmployerValues(
    fields: ProfileQuestionField[],
    body: unknown,
) {
    const answers =
        body && typeof body === "object" && !Array.isArray(body)
            ? { ...(body as Record<string, unknown>) }
            : {};
    for (const field of fields) {
        if (!fieldIsLocked(field)) continue;
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

    if (!body || typeof body !== "object" || Array.isArray(body) || (body as Record<string, unknown>).declaration !== "ja") {
        throw new AppError(BAD_REQUEST, "Bitte bestätigen Sie die Erklärung der beschäftigten Person.");
    }

    const definition = storedDefinition(submission.formDefinition);
    const fields = fieldsOf(definition);
    const repeaters = definition
        ? definitionRepeaters(definition)
        : ["children", "priorEmployment"];
    const answers = clearUndistributedWeekdays(
        fields,
        questionnaireAnswerSchema(fields, repeaters).parse(
            lockEmployerValues(fields, body),
        ) as QuestionnaireAnswers,
    );
    for (const field of fields) {
        if (field.type !== "file") continue;
        const value = String((answers as Record<string, unknown>)[field.key] ?? "");
        if (value && !fileAnswerForSubmission(value, submission.id)) {
            throw new AppError(BAD_REQUEST, "Die hochgeladene Datei gehört nicht zu diesem Formular.");
        }
    }
    const matchAnswers = { ...answers } as QuestionnaireAnswers;
    for (const field of fields) {
        if (field.type === "file") delete (matchAnswers as Record<string, unknown>)[field.key];
    }
    const matchFields = fields.filter((field) => field.type !== "file").map((field) => ({
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
                  readDocumentSegments(contract.body ?? contract.master.body),
                  matchAnswers,
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
            data: flattenQuestionnaireAnswers(
                answers,
                fields,
                definition ? definitionRepeaters(definition) : [],
            ).map((answer) => ({
                submissionId: submission.id,
                key: answer.key,
                value: answer.value,
            })),
        });
        await fileQuestionnaireAnswers(tx, {
            engagementId: submission.engagementId,
            submissionId: submission.id,
            uploadedByUserId: submission.engagement.responsibleUserId,
            fields,
            answers,
        });

        const workerData = workerProfileFromQuestionnaire(fields, answers);
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
            const printTask = await tx.issue.findFirst({
                where: {
                    workerEngagementId: submission.engagementId,
                    kind: "contract_send",
                },
            });
            if (printTask) {
                await tx.issue.updateMany({
                    where: { id: printTask.id, status: "open" },
                    data: { status: "in_progress" },
                });
            } else {
                // Older engagements may not have a print task yet.
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
        }
    });

    return { status: "completed" as const };
}

const FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function uploadedName(original: string) {
    const base = original.split(/[/\\]/).pop() ?? "Datei";
    const cleaned = base.replace(/[^\w.\- ()äöüÄÖÜß]+/g, "").slice(0, 180);
    return cleaned || "Datei";
}

export async function storeQuestionnaireFile(token: string, file: Express.Multer.File) {
    const submission = await prisma.questionnaireSubmission.findUnique({
        where: { token },
        select: { id: true, status: true },
    });
    if (!submission) throw new AppError(NOT_FOUND, "Formular nicht gefunden.");
    if (submission.status !== "sent") {
        throw new AppError(BAD_REQUEST, "Der Fragebogen wurde bereits abgeschickt.");
    }
    if (!file?.buffer?.length || !FILE_TYPES.has(file.mimetype)) {
        throw new AppError(BAD_REQUEST, "Erlaubt sind PDF, JPEG, PNG und WebP.");
    }
    const stored = await uploadFileToS3(file, submission.id, "questionnaires");
    if (!stored.success || !stored.key?.startsWith(`questionnaires/${submission.id}/`)) {
        throw new AppError(BAD_REQUEST, "Die Datei konnte nicht gespeichert werden.");
    }
    return {
        value: encodeFileAnswer(uploadedName(file.originalname), stored.key, {
            mime: file.mimetype,
            size: file.size,
        }),
    };
}
