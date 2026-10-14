import { prisma } from "@/lib/prisma";
import { primaryEmploymentContract } from "@/services/documentMaster.service";
import { readDocumentSegments } from "@/services/documentBody";
import {
    parseQuestionnaireDefinition,
    seedQuestionnaireDefinition,
    type QuestionnaireDefinition,
} from "@/services/questionnaireDefinition";
import { Prisma } from "@prisma/client";

function storedDefinition(value: Prisma.JsonValue | null): QuestionnaireDefinition | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const items = "items" in value ? value.items : null;
    if (!Array.isArray(items) || items.length === 0) return null;
    return parseQuestionnaireDefinition(value);
}

export async function questionnaireForOrganization(organizationId: string) {
    const existing = await prisma.questionnaire.findUnique({
        where: { organizationId },
    });
    const current = existing ? storedDefinition(existing.definition) : null;
    if (current) return current;

    const definition = seedQuestionnaireDefinition();
    await prisma.questionnaire.upsert({
        where: { organizationId },
        create: { organizationId, definition },
        update: { definition },
    });
    return definition;
}

export async function saveOrganizationQuestionnaire(
    organizationId: string,
    input: unknown,
) {
    const definition = parseQuestionnaireDefinition(input);
    await prisma.questionnaire.upsert({
        where: { organizationId },
        create: { organizationId, definition },
        update: { definition },
    });
    return definition;
}

export async function employmentContractFields(organizationId: string) {
    const master = await primaryEmploymentContract(organizationId);
    if (!master) return [];
    const seen = new Set<string>();
    return readDocumentSegments(master.body).flatMap((segment) => {
        if (segment.type !== "input" || seen.has(segment.key)) return [];
        seen.add(segment.key);
        return [{ key: segment.key, label: segment.label }];
    });
}
