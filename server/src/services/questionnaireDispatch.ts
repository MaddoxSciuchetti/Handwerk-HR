import { FRONTENDURL } from "@/constants/env";
import { NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import {
    applyOverrides,
    definitionFields,
    definitionRepeaters,
    isOfficeEditable,
    presentQuestions,
    readOverrides,
    type QuestionnaireDefinition,
} from "@/services/questionnaireDefinition";
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
) {
    const merged = applyOverrides(definition, overrides);
    const editable = new Set(
        definitionFields(definition).filter(isOfficeEditable).map((field) => field.key),
    );
    return {
        intro: merged.intro,
        questions: presentQuestions(merged).map((question) => ({
            ...question,
            officeEditable: editable.has(question.key),
        })),
        repeaters: definitionRepeaters(merged),
    };
}

export async function getQuestionnaireDraft(params: {
    organizationId: string;
    engagementId: string;
}) {
    const engagement = await findEngagement(params.organizationId, params.engagementId);
    const definition = await questionnaireForOrganization(params.organizationId);
    return {
        workerId: engagement.worker.id,
        engagementId: engagement.id,
        email: engagement.worker.email,
        sent: Boolean(engagement.questionnaireSubmission),
        ...previewFrom(definition, readOverrides(engagement.questionnaireOverrides)),
    };
}

export async function saveQuestionnaireDraft(params: {
    organizationId: string;
    engagementId: string;
    values: unknown;
}) {
    const engagement = await findEngagement(params.organizationId, params.engagementId);
    if (engagement.questionnaireSubmission) {
        return getQuestionnaireDraft(params);
    }
    const definition = await questionnaireForOrganization(params.organizationId);
    const posted = readOverrides(params.values);
    const overrides: Record<string, string> = {};
    for (const field of definitionFields(definition)) {
        if (!isOfficeEditable(field) || !(field.key in posted)) continue;
        overrides[field.key] = posted[field.key] ?? "";
    }
    await prisma.workerEngagement.update({
        where: { id: engagement.id },
        data: { questionnaireOverrides: overrides },
    });
    return getQuestionnaireDraft(params);
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

export async function sendEngagementQuestionnaire(params: {
    organizationId: string;
    createdByUserId: string;
    engagementId: string;
}) {
    const engagement = await findEngagement(params.organizationId, params.engagementId);
    if (engagement.questionnaireSubmission) {
        const emailSent = await deliverQuestionnaire(
            engagement.worker.email,
            engagement.questionnaireSubmission.token,
        );
        return { emailSent, engagementId: engagement.id };
    }

    const definition = applyOverrides(
        await questionnaireForOrganization(params.organizationId),
        readOverrides(engagement.questionnaireOverrides),
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
        const master = await tx.documentMaster.findFirst({
            where: {
                organizationId: params.organizationId,
                kind: "employment_contract",
            },
            orderBy: { updatedAt: "desc" },
        });
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

    const emailSent = await deliverQuestionnaire(engagement.worker.email, token);
    return { emailSent, engagementId: engagement.id };
}
