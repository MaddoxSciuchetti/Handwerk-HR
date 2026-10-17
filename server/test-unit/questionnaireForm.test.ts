import {
    encodeFileAnswer,
    flattenQuestionnaireAnswers,
    QUESTIONNAIRE_FIELDS,
    questionnaireAnswerSchema,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";

function answers(extra: Partial<QuestionnaireAnswers> = {}): QuestionnaireAnswers {
    return {
        ...Object.fromEntries(QUESTIONNAIRE_FIELDS.map((field) => [field.key, ""])),
        children: [],
        priorEmployment: [],
        ...extra,
    } as QuestionnaireAnswers;
}

describe("questionnaire form", () => {
    it("asks the tradesperson for the open Personalbogen fields", () => {
        const sections = QUESTIONNAIRE_FIELDS.map((field) => field.section);
        const unique = [...new Set(sections)];

        expect(unique).toEqual([
            "Persönliche Angaben",
            "Beschäftigung",
            "Ggf.Verteilung d. wöchentl. Arbeitszeit (Std.)",
            "Steuer",
            "Sozialversicherung",
            "VWL - nur notwendig, wenn Vertrag vorliegt",
            "Erklärung",
            "Bei Minderjährigen Unterschrift des gesetzlichen Vertreters",
        ]);
        const keys = QUESTIONNAIRE_FIELDS.map((field) => String(field.key));
        expect(keys).not.toContain("disabled");
        expect(keys.some((key) => key.startsWith("pay"))).toBe(false);
        expect(keys).not.toContain("costCenter");
        expect(QUESTIONNAIRE_FIELDS.some((field) => field.key === "hoursMonday" && field.required)).toBe(
            false,
        );
        expect(QUESTIONNAIRE_FIELDS.some((field) => field.key === "declaration" && field.required)).toBe(
            true,
        );
    });

    it("stores only the child rows the tradesperson added", () => {
        const stored = flattenQuestionnaireAnswers(
            answers({
                firstName: "Ada",
                children: [
                    { lastName: "Lovelace", firstName: "Ann", birthday: "2018-04-01" },
                    { lastName: "", firstName: "", birthday: "" },
                ],
                priorEmployment: [{ from: "2026-01-01", until: "2026-03-01", kind: "Aushilfe" }],
            }),
        );

        expect(stored).toEqual(
            expect.arrayContaining([
                { key: "firstName", value: "Ada" },
                { key: "child.1.lastName", value: "Lovelace" },
                { key: "child.1.firstName", value: "Ann" },
                { key: "child.1.birthday", value: "2018-04-01" },
                { key: "prior.1.kind", value: "Aushilfe" },
            ]),
        );
        expect(stored.some((row) => row.key.startsWith("child.2"))).toBe(false);
    });

    it("accepts one label from a checkbox pair", () => {
        const schema = questionnaireAnswerSchema(
            [
                {
                    key: "shift",
                    label: "Schicht",
                    section: "Weitere Angaben",
                    type: "check",
                    options: ["Früh", "Spät"],
                    required: true,
                },
            ],
            [],
        );

        expect(schema.parse({ shift: "Spät" })).toMatchObject({ shift: "Spät" });
        expect(() => schema.parse({ shift: "Nacht" })).toThrow("ungültige Auswahl");
        expect(() => schema.parse({ shift: "" })).toThrow("erforderlich");
    });

    it("accepts only a 12-character Versicherungsnummer with a valid check digit", () => {
        const schema = questionnaireAnswerSchema(
            [
                {
                    key: "insuranceNumber",
                    label: "Versicherungsnummer",
                    section: "Persönliche Angaben",
                    type: "text",
                    max: 12,
                },
            ],
            [],
        );

        expect(schema.parse({ insuranceNumber: "10 010490 A 443" })).toMatchObject({
            insuranceNumber: "10010490A443",
        });
        expect(() => schema.parse({ insuranceNumber: "10010490A444" })).toThrow(
            "Versicherungsnummer",
        );
        expect(() => schema.parse({ insuranceNumber: "32010490A443" })).toThrow(
            "Versicherungsnummer",
        );
    });

    it("accepts an uploaded file and allows an optional one to stay empty", () => {
        const key = "questionnaires/11111111-1111-4111-8111-111111111111/1710000000000-22222222-2222-4222-8222-222222222222";
        const schema = questionnaireAnswerSchema(
            [
                {
                    key: "custom.license",
                    label: "Führerschein",
                    section: "Weitere Angaben",
                    type: "file",
                    required: false,
                },
            ],
            [],
        );
        expect(schema.parse({ "custom.license": "" })).toMatchObject({
            "custom.license": "",
        });
        expect(
            schema.parse({ "custom.license": encodeFileAnswer("Führerschein.pdf", key) }),
        ).toMatchObject({ "custom.license": encodeFileAnswer("Führerschein.pdf", key) });
        expect(() => schema.parse({ "custom.license": "Führerschein.pdf" })).toThrow("Datei");
    });
});
