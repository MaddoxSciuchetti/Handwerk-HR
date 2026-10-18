import { isCurrentDateField } from "../../../shared/document";
import type { DocumentSegment } from "@/services/documentBody";
import {
    acceptModelMatches,
    composedQuestionnaireValues,
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
    const fields: { key: string; label: string; type?: string }[] = [];
    const seen = new Set<string>();
    for (const segment of segments) {
        if (
            segment.type !== "input" ||
            segment.fieldType === "points" ||
            isCurrentDateField(segment) ||
            seen.has(segment.key) ||
            filled.has(segment.key)
        ) {
            continue;
        }
        seen.add(segment.key);
        fields.push({
            key: segment.key,
            label: segment.label,
            type: segment.fieldType,
        });
    }
    return fields;
}

function consumedAnswerKeys(
    fields: MatchField[],
    placed: { key: string }[],
) {
    const filled = new Set(placed.map((entry) => entry.key));
    const consumed = new Set<string>();
    for (const field of fields) {
        if (field.contractFieldKey && filled.has(field.contractFieldKey)) {
            consumed.add(field.key);
        }
    }
    return consumed;
}

function candidateAnswers(
    answers: QuestionnaireAnswers,
    email: string,
    matchFields: MatchField[],
    consumed: Set<string>,
    placed: Set<string>,
) {
    const rows = unmatchedQuestionnaireAnswers(
        [],
        {},
        flattenQuestionnaireAnswers(
            answers,
            matchFields.length > 0 ? matchFields : undefined,
        ),
        matchFields,
    ).filter((answer) => !consumed.has(answer.key));
    const seen = new Set(rows.map((row) => row.value));
    for (const composed of composedQuestionnaireValues(answers, email)) {
        if (placed.has(composed.value) || seen.has(composed.value)) continue;
        seen.add(composed.value);
        rows.push(composed);
    }
    return rows;
}

async function askModel(
    fields: { key: string; label: string; type?: string }[],
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
            max_tokens: 4000,
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
                        "Du ordnest Antworten eines Personalfragebogens den noch leeren Eingabefeldern eines Arbeitsvertrags zu. Der value muss exakt einem gegebenen Antwortwert entsprechen. Erfinde keinen Text und formuliere nichts um. Ordne jedes Feld zu, dessen Bezeichnung oder Bedeutung einer Antwort entspricht, auch wenn die Beschriftung anders formuliert ist (Name, Anschrift, Geburtsdatum, IBAN, Steuer, Beruf, Eintritt, Stunden, Geschlecht, Versicherung). Zusammengesetzte Antworten (Vor- und Nachname, Anschrift, PLZ und Ort, E-Mail) sind für kombinierte Felder da. Kinder und frühere Beschäftigungen nur den Feldern zuordnen, die sich darauf beziehen. Wochentagsstunden nur dem gleichnamigen Tag zuordnen. Einen Wert nur dann mehrfach verwenden, wenn mehrere Felder dieselbe Angabe meinen. Kontrollkästchen bekommen ja oder nein. Felder ohne passende Antwort weglassen.",
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
    const placed = new Set(placedEntries.map((entry) => entry.value));
    const leftovers = candidateAnswers(
        answers,
        email,
        matchFields,
        consumedAnswerKeys(matchFields, placedEntries),
        placed,
    );
    if (!openAiKey() || fields.length === 0 || leftovers.length === 0) return placedEntries;

    try {
        const matched = await askModel(fields, leftovers);
        return [...placedEntries, ...matched];
    } catch {
        return placedEntries;
    }
}
