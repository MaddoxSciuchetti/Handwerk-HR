import type { DocumentSegment } from "@/services/documentBody";
import {
    acceptModelMatches,
    deterministicContractValues,
    unmatchedQuestionnaireAnswers,
    type MatchField,
} from "@/services/contractFieldMatch";
import {
    flattenQuestionnaireAnswers,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";

const MODEL = "gpt-4o-mini";

const matchSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        matches: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    key: { type: "string" },
                    value: { type: "string" },
                },
                required: ["key", "value"],
            },
        },
    },
    required: ["matches"],
} as const;

function openAiKey() {
    return process.env.OPENAI_API_KEY?.trim() ?? "";
}

function leftoverFields(
    segments: DocumentSegment[],
    filled: Set<string>,
) {
    const fields: { key: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const segment of segments) {
        if (segment.type !== "input" || seen.has(segment.key) || filled.has(segment.key)) {
            continue;
        }
        seen.add(segment.key);
        fields.push({ key: segment.key, label: segment.label });
    }
    return fields;
}

async function askModel(
    fields: { key: string; label: string }[],
    answers: { key: string; label: string; value: string }[],
) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${openAiKey()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: MODEL,
            temperature: 0,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "contract_field_matches",
                    strict: true,
                    schema: matchSchema,
                },
            },
            messages: [
                {
                    role: "system",
                    content:
                        "Du ordnest Antworten eines Personalfragebogens den noch leeren Eingabefeldern eines Arbeitsvertrags zu. Gib nur Zuordnungen zurück, deren value exakt einem der gegebenen Antwortwerte entspricht. Erfinde keinen Text und ändere keine Werte. Lass Felder weg, die nicht eindeutig passen.",
                },
                {
                    role: "user",
                    content: JSON.stringify({ fields, answers }),
                },
            ],
        }),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return [];
    return acceptModelMatches(fields, answers, JSON.parse(content) as unknown);
}

export async function matchQuestionnaireToContract(
    segments: DocumentSegment[],
    answers: QuestionnaireAnswers,
    email = "",
    matchFields: MatchField[] = [],
) {
    const placedEntries = deterministicContractValues(
        segments,
        answers,
        email,
        matchFields,
    );
    const filled = new Set(placedEntries.map((entry) => entry.key));
    const fields = leftoverFields(segments, filled);
    const placed = Object.fromEntries(placedEntries.map((entry) => [entry.key, entry.value]));
    const leftovers = unmatchedQuestionnaireAnswers(
        segments,
        placed,
        flattenQuestionnaireAnswers(
            answers,
            matchFields.length > 0 ? matchFields : undefined,
        ),
        matchFields,
    );
    if (!openAiKey() || fields.length === 0 || leftovers.length === 0) return placedEntries;

    try {
        const matched = await askModel(fields, leftovers);
        return [...placedEntries, ...matched];
    } catch {
        return placedEntries;
    }
}
