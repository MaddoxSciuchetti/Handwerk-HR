import { FRONTENDURL, QUESTIONNAIRE_MOCK_RESPONSES } from "@/constants/env";
import { NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import {
    applyOverrides,
    definitionFields,
    definitionRepeaters,
    presentQuestions,
    readEngagementDraft,
    withAddedQuestions,
    type QuestionnaireDefinition,
    type QuestionnaireFieldItem,
} from "@/services/questionnaireDefinition";
import { completeMockQuestionnaire } from "@/services/questionnaireMock";
import { primaryEmploymentContract } from "@/services/documentMaster.service";
import { questionnaireForOrganization } from "@/services/questionnaireTemplate";
import AppError from "@/utils/AppError";
import { getQuestionnaireTemplate } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/sendMail";
import { randomUUID } from "crypto";

const EXPECTED_ONBOARDING_TASKS = [
    { title: "Fragebogen", status: "in_progress" },
    { title: "Arbeitsvertrag", status: "open" },
] as const;

async function findEngagement(organizationId: string, engagementId: string) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: { id: engagementId, organizationId, type: "onboarding" },
        include: {
            worker: { select: { id: true, email: true } },
            questionnaireSubmission: { select: { id: true, token: true, status: true } },
        },
    });
    if (!engagement) throw new AppError(NOT_FOUND, "Einsatz nicht gefunden.");
    return engagement;
}

function previewFrom(
    definition: QuestionnaireDefinition,
    overrides: Record<string, string>,
    added: QuestionnaireFieldItem[],
) {
    const merged = applyOverrides(withAddedQuestions(definition, added), overrides);
    return {
        name: merged.name ?? "Personalfragebogen",
        intro: merged.intro,
        questions: presentQuestions(merged).map((question) => ({
            ...question,
            officeEditable: true,
            employerFilled: false,
        })),
        repeaters: definitionRepeaters(merged),
        addedQuestions: added.map((question) => ({
            key: question.key,
            label: question.label,
            section: question.section,
            type: question.type,
            options: question.options,
        })),
    };
}

export async function getQuestionnaireDraft(params: {
    organizationId: string;
    engagementId: string;
}) {
    const engagement = await findEngagement(params.organizationId, params.engagementId);
    const definition = await questionnaireForOrganization(params.organizationId);
    const draft = readEngagementDraft(engagement.questionnaireOverrides);
    return {
        workerId: engagement.worker.id,
        engagementId: engagement.id,
        email: engagement.worker.email,
        sent: Boolean(engagement.questionnaireSubmission),
        status: engagement.questionnaireSubmission?.status ?? null,
        mockEnabled: QUESTIONNAIRE_MOCK_RESPONSES,
        ...previewFrom(definition, draft.values, draft.questions),
    };
}

export async function saveQuestionnaireDraft(params: {
    organizationId: string;
    engagementId: string;
    values: unknown;
    questions?: unknown;
}) {
    const engagement = await findEngagement(params.organizationId, params.engagementId);
    if (engagement.questionnaireSubmission) {
        return getQuestionnaireDraft(params);
    }
    const definition = await questionnaireForOrganization(params.organizationId);
    const current = readEngagementDraft(engagement.questionnaireOverrides);
    const questions =
        params.questions === undefined ? current.questions : parseAdded(params.questions);
    const posted = readEngagementDraft({ values: params.values }).values;
    const merged = withAddedQuestions(definition, questions);
    const overrides: Record<string, string> = {};
    for (const field of definitionFields(merged)) {
        if (!(field.key in posted)) continue;
        overrides[field.key] = posted[field.key] ?? "";
    }
    await prisma.workerEngagement.update({
        where: { id: engagement.id },
        data: { questionnaireOverrides: { values: overrides, questions } },
    });
    return getQuestionnaireDraft(params);
}

function parseAdded(questions: unknown) {
    return readEngagementDraft({ questions, values: {} }).questions;
}

async function deliverQuestionnaire(email: string | null, token: string) {
    if (!email) return false;
    const formUrl = `${FRONTENDURL.replace(/\/$/, "")}/fragebogen/${token}`;
    const template = getQuestionnaireTemplate(formUrl);
    try {
        const sent = await sendMail({
            to: email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
        return !sent.error;
    } catch {
        return false;
    }
}

async function finishDispatch(
    email: string | null,
    token: string,
    engagementId: string,
) {
    if (QUESTIONNAIRE_MOCK_RESPONSES) {
        await completeMockQuestionnaire(token, email ?? "");
        return { emailSent: false, mockCompleted: true, engagementId };
    }
    return {
        emailSent: await deliverQuestionnaire(email, token),
        mockCompleted: false,
        engagementId,
    };
}

export async function sendEngagementQuestionnaire(params: {
    organizationId: string;
    createdByUserId: string;
    engagementId: string;
}) {
    const engagement = await findEngagement(params.organizationId, params.engagementId);
    if (engagement.questionnaireSubmission) {
        return finishDispatch(
            engagement.worker.email,
            engagement.questionnaireSubmission.token,
            engagement.id,
        );
    }

    const draft = readEngagementDraft(engagement.questionnaireOverrides);
    const definition = applyOverrides(
        withAddedQuestions(
            await questionnaireForOrganization(params.organizationId),
            draft.questions,
        ),
        draft.values,
    );
    const token = randomUUID();
    await prisma.$transaction(async (tx) => {
        await tx.issue.createMany({
            data: EXPECTED_ONBOARDING_TASKS.map((task) => ({
                workerEngagementId: engagement.id,
                createdByUserId: params.createdByUserId,
                status: task.status,
                title: task.title,
            })),
        });
        await tx.questionnaireSubmission.create({
            data: {
                engagementId: engagement.id,
                status: "sent",
                token,
                formDefinition: definition,
            },
        });
        const master = await primaryEmploymentContract(
            params.organizationId,
            tx,
        );
        if (master) {
            await tx.employmentContract.create({
                data: {
                    engagementId: engagement.id,
                    masterId: master.id,
                    status: "draft",
                },
            });
        }
    });

    return finishDispatch(engagement.worker.email, token, engagement.id);
}
