import { deterministicContractValues } from "@/services/contractFieldMatch";
import {
    fieldIsLocked,
    hourKeys,
    isWorkerLocked,
    parseQuestionnaireDefinition,
    readEngagementDraft,
    seedQuestionnaireDefinition,
    applyOverrides,
    withAddedQuestions,
} from "@/services/questionnaireDefinition";
import { personalbogenItems } from "@/services/personalbogenDefinition";
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
        expect(hourItems.every((item) => item.kind === "field" && item.required)).toBe(false);
        expect(hourItems.every((item) => item.kind === "field" && item.employerFilled)).toBe(
            false,
        );
        const distribution = definition.items.find(
            (item) => item.kind === "field" && item.key === "hoursDistribution",
        );
        expect(distribution).toMatchObject({ kind: "field", required: false, type: "single" });

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

    it("keeps a file question optional or required", () => {
        const optional = parseQuestionnaireDefinition({
            items: [
                {
                    kind: "field",
                    key: "custom.drivers-license",
                    label: "Führerschein",
                    type: "file",
                    required: false,
                },
            ],
        });
        expect(optional.items[0]).toMatchObject({
            type: "file",
            required: false,
            contractFieldKey: undefined,
        });
        const required = parseQuestionnaireDefinition({
            items: [
                {
                    kind: "field",
                    key: "custom.drivers-license",
                    label: "Führerschein",
                    type: "file",
                },
            ],
        });
        expect(required.items[0]).toMatchObject({ type: "file", required: true });
    });

    it("keeps a custom text question optional when it is not required", () => {
        const definition = parseQuestionnaireDefinition({
            items: [
                {
                    kind: "field",
                    key: "custom.optional-note",
                    label: "Hinweis",
                    type: "text",
                    required: false,
                },
            ],
        });
        expect(definition.items[0]).toMatchObject({ type: "text", required: false, builtin: false });
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

    it("stores zero hours separately from a blank day and an office-only week", () => {
        const definition = parseQuestionnaireDefinition({
            items: [
                {
                    kind: "field",
                    key: "hoursMonday",
                    defaultValue: "0",
                    officeOnly: true,
                    contractFieldKey: "arbeitszeit.mo",
                },
                { kind: "field", key: "hoursTuesday", defaultValue: "7,5" },
                { kind: "field", key: "hoursDistribution", required: true },
            ],
        });
        expect(definition.items[0]).toMatchObject({
            defaultValue: "0",
            officeOnly: true,
            required: false,
            contractFieldKey: "arbeitszeit.mo",
        });
        expect(definition.items[1]).toMatchObject({ defaultValue: "7,5", officeOnly: undefined });
        expect(definition.items[2]).toMatchObject({ required: true });
    });

    it("keeps a custom table and whether more rows are allowed", () => {
        const definition = parseQuestionnaireDefinition({
            items: [
                {
                    kind: "repeater",
                    key: "rows.kinder-liste",
                    section: "Kinder, für die eine Elterneigenschaft nachgewiesen werden kann",
                    allowMoreRows: true,
                    columns: [
                        { key: "name", label: "Name", type: "text" },
                        { key: "vorname", label: "Vorname", type: "text" },
                        { key: "geburtsdatum", label: "Geburtsdatum (TT.MM.JJJJ)", type: "date" },
                    ],
                },
            ],
        });
        expect(definition.items[0]).toMatchObject({
            kind: "repeater",
            key: "rows.kinder-liste",
            allowMoreRows: true,
            columns: [
                { key: "name", label: "Name" },
                { key: "vorname", label: "Vorname" },
                { key: "geburtsdatum", label: "Geburtsdatum (TT.MM.JJJJ)", type: "date" },
            ],
        });
    });

    it("round-trips office-only settings for built-in tables without changing their schema", () => {
        const definition = seedQuestionnaireDefinition();
        const changed = {
            ...definition,
            items: definition.items.map((item) => item.kind === "repeater" ? {
                ...item,
                allowMoreRows: true,
                columns: item.columns.map((column) => ({
                    ...column,
                    label: "Untrusted label",
                    type: "text",
                    officeOnly: true,
                })),
            } : item),
        };
        const saved = parseQuestionnaireDefinition(changed);
        for (const item of saved.items) {
            if (item.kind !== "repeater") continue;
            expect(item.columns.every((column) => column.officeOnly === true)).toBe(true);
            expect(item.allowMoreRows).toBe(true);
            expect(item.columns.some((column) => column.label === "Untrusted label")).toBe(false);
        }
        const unlocked = parseQuestionnaireDefinition({
            ...saved,
            items: saved.items.map((item) => item.kind === "repeater" ? {
                ...item,
                columns: item.columns.map((column) => ({ ...column, officeOnly: false })),
            } : item),
        });
        const reloaded = parseQuestionnaireDefinition(JSON.parse(JSON.stringify(unlocked)));
        for (const item of reloaded.items) {
            if (item.kind !== "repeater") continue;
            expect(item.columns.every((column) => column.officeOnly === false)).toBe(true);
        }
        const legacy = parseQuestionnaireDefinition({
            items: [{ kind: "repeater", key: "priorEmployment" }],
        });
        expect(legacy.items[0]).toMatchObject({
            columns: [expect.anything(), expect.anything(), expect.anything(), { key: "days", officeOnly: true }],
        });
    });

    it("keeps a renamed builtin question", () => {
        const definition = parseQuestionnaireDefinition({
            items: [{ kind: "field", key: "firstName", label: "Rufname" }],
        });
        expect(definition.items[0]).toMatchObject({ key: "firstName", label: "Rufname" });
    });

    it("builds the DATEV personalbogen and locks the grey fields for the office", () => {
        const definition = parseQuestionnaireDefinition({
            name: "Personalfragebogen",
            items: personalbogenItems(),
        });
        const byKey = new Map(definition.items.map((item) => [item.key, item]));
        expect(byKey.get("custom.schwerbehindert")).toMatchObject({
            section: "Persönliche Angaben",
            officeOnly: true,
        });
        expect(byKey.get("custom.beschaeftigungsbetrieb")).toMatchObject({
            defaultValue: "BSB Haustechnik GmbH",
            officeOnly: undefined,
        });
        expect(byKey.get("hoursMonday")).toMatchObject({ officeOnly: true });
        expect(byKey.get("children")).toMatchObject({
            kind: "repeater",
            columns: [
                { key: "lastName", label: "Name" },
                { key: "firstName", label: "Vorname" },
                { key: "birthday" },
            ],
        });
        expect(byKey.get("rows.entlohnung")).toMatchObject({
            kind: "repeater",
            columns: [
                { key: "bezeichnung", officeOnly: true },
                { key: "betrag", officeOnly: true },
                { key: "gueltigab", officeOnly: true },
                { key: "stundenlohn", officeOnly: true },
                { key: "stundenlohnab", officeOnly: true },
            ],
        });
        const prior = byKey.get("priorEmployment");
        expect(prior?.kind === "repeater" && prior.columns.map((column) => column.key)).toEqual([
            "from",
            "until",
            "kind",
            "days",
        ]);
        expect(fieldIsLocked({ key: "custom.kostenstelle", officeOnly: true })).toBe(true);
        expect(definition.items.length).toBeLessThanOrEqual(80);
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

    it("fills only the field the questionnaire binds and leaves the rest unbound", () => {
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

        expect(entries).toEqual([{ key: "contract.stunden", value: "40" }]);
    });
});
