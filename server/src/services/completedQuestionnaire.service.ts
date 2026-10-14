import { NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { parseQuestionnaireDefinition } from "@/services/questionnaireDefinition";
import {
  QUESTIONNAIRE_FIELDS,
  QUESTIONNAIRE_INTRO,
  QUESTIONNAIRE_REPEATERS,
  questionnaireAnswersFromStored,
} from "@/services/questionnaireForm";
import AppError from "@/utils/AppError";

export async function getCompletedQuestionnaire(params: {
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
      completedAt: true,
      formDefinition: true,
      answers: { select: { key: true, value: true } },
    },
  });
  if (!submission)
    throw new AppError(NOT_FOUND, "Ausgefüllter Fragebogen nicht gefunden.");

  const definition = submission.formDefinition
    ? parseQuestionnaireDefinition(submission.formDefinition)
    : {
        intro: QUESTIONNAIRE_INTRO,
        items: QUESTIONNAIRE_FIELDS.flatMap((field, index) => [
          { ...field, kind: "field" as const },
          ...QUESTIONNAIRE_REPEATERS.filter(
            (repeater) =>
              repeater.afterSection === field.section &&
              QUESTIONNAIRE_FIELDS[index + 1]?.section !== field.section,
          ).map((repeater) => ({ ...repeater, kind: "repeater" as const })),
        ]),
      };
  return {
    id: submission.id,
    name: 'name' in definition ? definition.name ?? "Personalfragebogen" : "Personalfragebogen",
    completedAt: submission.completedAt,
    intro:
      submission.formDefinition &&
      typeof submission.formDefinition === "object" &&
      "intro" in submission.formDefinition &&
      typeof submission.formDefinition.intro === "string"
        ? submission.formDefinition.intro
        : definition.intro,
    items: definition.items,
    answers: questionnaireAnswersFromStored(submission.answers),
  };
}
