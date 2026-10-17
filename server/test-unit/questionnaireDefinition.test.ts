import { deterministicContractValues } from "@/services/contractFieldMatch";
import {
    hourKeys,
    isWorkerLocked,
    parseQuestionnaireDefinition,
    readEngagementDraft,
    seedQuestionnaireDefinition,
    applyOverrides,
    withAddedQuestions,
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
    it("keeps the chosen name through parsing and engagement-specific changes", () => {
        const definition = parseQuestionnaireDefinition({
            name: "  Personalbogen Montage  ",
            items: [{ kind: "field", key: "firstName" }],
        });
        expect(definition.name).toBe("Personalbogen Montage");
        expect(applyOverrides(withAddedQuestions(definition, []), { firstName: "Ada" }).name)
            .toBe("Personalbogen Montage");
    });

    it("supplies a name for older definitions and rejects empty or oversized names", () => {
        const items = [{ kind: "field", key: "firstName" }];
        expect(parseQuestionnaireDefinition({ items }).name).toBe("Personalfragebogen");
        for (const name of ["   ", "x".repeat(201), 123]) {
            expect(() => parseQuestionnaireDefinition({ items, name })).toThrow("Namen");
        }
    });
    it("seeds weekday hours and Teilzeit as required questions", () => {
        const definition = seedQuestionnaireDefinition();
        const hours = new Set<string>(hourKeys());
        const hourItems = definition.items.filter(
            (item) => item.kind === "field" && hours.has(item.key),
        );
        expect(hourItems).toHaveLength(7);
        expect(hourItems.every((item) => item.kind === "field" && item.required)).toBe(true);
        expect(hourItems.every((item) => item.kind === "field" && item.employerFilled)).toBe(
            false,
        );

        const extent = definition.items.find(
            (item) => item.kind === "field" && item.key === "employmentExtent",
        );
        expect(extent).toMatchObject({
            kind: "field",
            required: true,
            options: ["Vollzeit", "Teilzeit"],
        });
    });

    it("reads the seeded form back, including the unlabeled employment choice", () => {
        const seed = seedQuestionnaireDefinition();
        const parsed = parseQuestionnaireDefinition(JSON.parse(JSON.stringify(seed)));
        expect(parsed.items.map((item) => item.key)).toEqual(seed.items.map((item) => item.key));
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
        const custom = definition.items[1];
        expect(custom).toMatchObject({
            label: "Schuhgröße",
            required: true,
            employerFilled: false,
        });
        expect(definition.items[0]).toMatchObject({ label: "Vorname" });
    });

    it("stores two labeled checkboxes and the chosen text", () => {
        const definition = parseQuestionnaireDefinition({
            items: [
                {
                    kind: "field",
                    key: "custom.shift-choice",
                    label: "Schicht",
                    type: "check",
                    options: ["Früh", "Spät"],
                    defaultValue: "Spät",
                },
            ],
        });
        expect(definition.items[0]).toMatchObject({
            type: "check",
            options: ["Früh", "Spät"],
            defaultValue: "Spät",
        });
    });

    it("stores a Versicherungsnummer only in the official 12-character form", () => {
        const definition = parseQuestionnaireDefinition({
            items: [
                {
                    kind: "field",
                    key: "insuranceNumber",
                    defaultValue: "10 010490 A 443",
                },
            ],
        });
        expect(definition.items[0]).toMatchObject({ defaultValue: "10010490A443" });
        expect(() =>
            parseQuestionnaireDefinition({
                items: [
                    {
                        kind: "field",
                        key: "insuranceNumber",
                        defaultValue: "10010490A444",
                    },
                ],
            }),
        ).toThrow("Versicherungsnummer");
    });

    it("rejects a checkbox that has only one label", () => {
        expect(() =>
            parseQuestionnaireDefinition({
                items: [
                    {
                        kind: "field",
                        key: "custom.shift-choice",
                        label: "Schicht",
                        type: "check",
                        options: ["Früh"],
                    },
                ],
            }),
        ).toThrow("Eine Checkbox braucht zwei bis acht Beschriftungen.");
    });

    it("keeps a renamed builtin question", () => {
        const definition = parseQuestionnaireDefinition({
            items: [{ kind: "field", key: "firstName", label: "Rufname" }],
        });
        expect(definition.items[0]).toMatchObject({ key: "firstName", label: "Rufname" });
    });

    it("locks only answers the office actually filled in", () => {
        expect(isWorkerLocked({ defaultValue: "BSB" })).toBe(true);
        expect(isWorkerLocked({ defaultValue: "  " })).toBe(false);
        expect(isWorkerLocked({})).toBe(false);
    });

    it("keeps questions added after the engagement exists", () => {
        const draft = readEngagementDraft({
            values: { firstName: "Ada" },
            questions: [
                {
                    kind: "field",
                    key: "custom.shoe-size",
                    label: "Schuhgröße",
                    type: "text",
                },
            ],
        });
        expect(draft.values).toEqual({ firstName: "Ada" });
        expect(draft.questions.map((question) => question.label)).toEqual(["Schuhgröße"]);
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
