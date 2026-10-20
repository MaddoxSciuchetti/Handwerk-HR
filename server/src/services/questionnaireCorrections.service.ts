import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import {
  definitionFields,
  definitionRepeaters,
  parseQuestionnaireDefinition,
} from "@/services/questionnaireDefinition";
import {
  flattenQuestionnaireAnswers,
  questionnaireAnswersFromStored,
  questionnaireAnswerSchema,
  QUESTIONNAIRE_FIELDS,
  QUESTIONNAIRE_REPEATERS,
  type QuestionnaireAnswers,
} from "@/services/questionnaireForm";
import { workerProfileFromQuestionnaire } from "@/services/questionnaireWorkerProfile";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const correctionSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    answers: z.record(z.string(), z.unknown()),
  })
  .strict();

export async function saveCompletedQuestionnaire(params: {
  organizationId: string;
  workerId: string;
  engagementId: string;
  changedByUserId: string;
  input: unknown;
}) {
  const input = correctionSchema.parse(params.input);
  const submission = await prisma.questionnaireSubmission.findFirst({
    where: {
      engagementId: params.engagementId,
      status: "completed",
      engagement: {
        workerId: params.workerId,
        organizationId: params.organizationId,
      },
    },
    include: { answers: true },
  });
  if (!submission)
    throw new AppError(NOT_FOUND, "Ausgefüllter Fragebogen nicht gefunden.");
  if (submission.revision !== input.revision) {
    throw new AppError(
      CONFLICT,
      "Der Fragebogen wurde inzwischen geändert. Bitte neu öffnen.",
    );
  }
  const definition = submission.formDefinition
    ? parseQuestionnaireDefinition(submission.formDefinition)
    : null;
  const fields = definition
    ? definitionFields(definition)
    : QUESTIONNAIRE_FIELDS;
  const repeaters = definition
    ? definitionRepeaters(definition)
    : QUESTIONNAIRE_REPEATERS;
  const keys = new Set(Object.keys(input.answers));
  const editable = new Set([
    ...fields
      .filter((field) => field.type !== "file")
      .map((field) => field.key),
    ...repeaters.map((repeater) => repeater.key),
  ]);
  if ([...keys].some((key) => !editable.has(key))) {
    throw new AppError(
      BAD_REQUEST,
      "Ein Feld kann hier nicht bearbeitet werden.",
    );
  }
  // Validate just the supplied corrections, preserving historical answers and attachments.
  const editedFields = fields.filter((field) => keys.has(field.key));
  const editedRepeaters = repeaters.filter((repeater) =>
    keys.has(repeater.key),
  );
  const corrected = questionnaireAnswerSchema(editedFields, editedRepeaters)
    .strict()
    .parse(input.answers) as QuestionnaireAnswers;
  const previous = questionnaireAnswersFromStored(submission.answers);
  const changes = [...keys].flatMap((key) => {
    const before =
      (previous as Record<string, unknown>)[key] ??
      (editedRepeaters.some((item) => item.key === key) ? [] : "");
    const after = (corrected as Record<string, unknown>)[key];
    return JSON.stringify(before) === JSON.stringify(after)
      ? []
      : [{ key, before, after }];
  });
  if (changes.length === 0) return;

  const replaced = new Set(changes.map((change) => change.key));
  const repeaterPrefixes = editedRepeaters
    .filter((item) => replaced.has(item.key))
    .map((item) =>
      item.key === "children"
        ? "child."
        : item.key === "priorEmployment"
          ? "prior."
          : `${item.key}.`,
    );
  const updated = flattenQuestionnaireAnswers(
    corrected,
    editedFields.filter((field) => replaced.has(field.key)),
    editedRepeaters.filter((repeater) => replaced.has(repeater.key)),
  ).filter(
    (answer) =>
      replaced.has(answer.key) ||
      repeaterPrefixes.some((prefix) => answer.key.startsWith(prefix)),
  );
  const profile = workerProfileFromQuestionnaire(
    editedFields.filter((field) => replaced.has(field.key)),
    corrected,
  );
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.questionnaireSubmission.updateMany({
      where: {
        id: submission.id,
        revision: input.revision,
        status: "completed",
      },
      data: { revision: { increment: 1 } },
    });
    if (claimed.count !== 1)
      throw new AppError(
        CONFLICT,
        "Der Fragebogen wurde inzwischen geändert. Bitte neu öffnen.",
      );
    await tx.questionnaireAnswer.deleteMany({
      where: {
        submissionId: submission.id,
        OR: [
          {
            key: {
              in: [...replaced].filter((key) =>
                editedFields.some((field) => field.key === key),
              ),
            },
          },
          ...repeaterPrefixes.map((prefix) => ({
            key: { startsWith: prefix },
          })),
        ],
      },
    });
    if (updated.length)
      await tx.questionnaireAnswer.createMany({
        data: updated.map((row) => ({ ...row, submissionId: submission.id })),
      });
    await tx.questionnaireChange.create({
      data: {
        submissionId: submission.id,
        revision: input.revision + 1,
        changedByUserId: params.changedByUserId,
        changes: changes as Prisma.InputJsonValue,
      },
    });
    if (Object.keys(profile).length)
      await tx.worker.update({ where: { id: params.workerId }, data: profile });
  });
}
