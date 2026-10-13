import { deterministicContractValues } from "@/services/contractFieldMatch";
import {
    hourKeys,
    parseQuestionnaireDefinition,
    seedQuestionnaireDefinition,
} from "@/services/questionnaireDefinition";
import {
    QUESTIONNAIRE_FIELDS,
    workerTextFromAnswers,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";

function answers(extra: Record<string, string> = {}): QuestionnaireAnswers {
    return {
        ...Object.fromEntries(QUESTIONNAIRE_FIELDS.map((field) => [field.key, ""])),
        children: [],
        priorEmployment: [],
        ...extra,
    } as unknown as QuestionnaireAnswers;
}

describe("questionnaire definition", () => {
    it("seeds weekday hours and Teilzeit as grey employer fields", () => {
        const definition = seedQuestionnaireDefinition();
        const hours = new Set<string>(hourKeys());
        const hourItems = definition.items.filter(
            (item) => item.kind === "field" && hours.has(item.key),
        );
        expect(hourItems).toHaveLength(7);
        expect(hourItems.every((item) => item.kind === "field" && item.employerFilled)).toBe(
            true,
        );

        const extent = definition.items.find(
            (item) => item.kind === "field" && item.key === "employmentExtent",
        );
        expect(extent).toMatchObject({
            kind: "field",
            employerFilled: true,
            options: ["Vollzeit", "Teilzeit"],
        });
    });

    it("keeps a custom question and drops unknown builtins", () => {
        const definition = parseQuestionnaireDefinition({
            items: [
                { kind: "field", key: "firstName", label: "Vorname" },
                {
                    kind: "field",
                    key: "custom.shoe-size",
                    label: "Schuhgröße",
                    type: "text",
                    contractFieldKey: "contract.schuhe",
                },
            ],
        });
        expect(definition.items.map((item) => item.key)).toEqual([
            "firstName",
            "custom.shoe-size",
        ]);
    });
});

describe("worker update from answers", () => {
    it("ignores custom keys and fields that are not on the form", () => {
        const patch = workerTextFromAnswers(
            [{ key: "custom.shoe-size" }, { key: "firstName" }],
            answers({ firstName: "Ada", lastName: "Lovelace" }),
        );
        expect(patch.data).toEqual({ firstName: "Ada" });
        expect(patch.birthday).toBe("");
    });
});

describe("deterministic contract matching", () => {
    const segments = [
        { type: "input" as const, key: "contract.stunden", label: "Wochenstunden" },
        { type: "input" as const, key: "contract.schuhe", label: "Schuhgröße" },
        { type: "input" as const, key: "contract.vorname", label: "Vorname" },
    ];

    it("fills a bound value and a same-label question, and leaves a different name open", () => {
        const entries = deterministicContractValues(
            segments,
            {
                ...answers({ firstName: "Ada" }),
                "custom.hours": "40",
                "custom.shoes": "42",
                "custom.note": "Bitte früh",
            } as QuestionnaireAnswers,
            "",
            [
                {
                    key: "custom.hours",
                    label: "Arbeitszeit",
                    contractFieldKey: "contract.stunden",
                },
                { key: "custom.shoes", label: "Schuhgröße" },
                { key: "custom.note", label: "Hinweis" },
                { key: "firstName", label: "Vorname" },
            ],
        );

        expect(entries).toEqual(
            expect.arrayContaining([
                { key: "contract.stunden", value: "40" },
                { key: "contract.schuhe", value: "42" },
                { key: "contract.vorname", value: "Ada" },
            ]),
        );
        expect(entries.some((entry) => entry.value === "Bitte früh")).toBe(false);
    });
});
