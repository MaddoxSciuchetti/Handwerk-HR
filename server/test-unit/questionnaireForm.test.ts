import {
    flattenQuestionnaireAnswers,
    QUESTIONNAIRE_FIELDS,
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
});
