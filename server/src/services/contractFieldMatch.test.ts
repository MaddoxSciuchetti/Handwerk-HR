import {
    acceptModelMatches,
    contractValuesFromAnswers,
    deterministicContractValues,
    unmatchedQuestionnaireAnswers,
} from "@/services/contractFieldMatch";
import type { DocumentSegment } from "@/services/documentBody";
import type { QuestionnaireAnswers } from "@/services/questionnaireForm";

const segments: DocumentSegment[] = [
    { type: "text", text: "Name: " },
    { type: "input", key: "contract.vorname", label: "Vorname" },
    { type: "text", text: " " },
    { type: "input", key: "contract.nachname", label: "Nachname" },
];

describe("unmatchedQuestionnaireAnswers", () => {
    it("lists answers that are not already written into a contract field", () => {
        const unmatched = unmatchedQuestionnaireAnswers(
            segments,
            { "contract.vorname": "Ada" },
            [
                { key: "firstName", value: "Ada" },
                { key: "lastName", value: "Lovelace" },
                { key: "iban", value: "DE89" },
            ],
        );

        expect(unmatched).toEqual([
            { key: "lastName", label: "Familienname", value: "Lovelace" },
            { key: "iban", label: "IBAN", value: "DE89" },
        ]);
    });

    it("hides name parts when the contract already contains the full name", () => {
        const unmatched = unmatchedQuestionnaireAnswers(
            [{ type: "input", key: "contract.name", label: "Name" }],
            { "contract.name": "Ada Lovelace" },
            [
                { key: "firstName", value: "Ada" },
                { key: "lastName", value: "Lovelace" },
            ],
        );

        expect(unmatched).toEqual([]);
    });

    it("formats a birthday for the chip the user drops", () => {
        const unmatched = unmatchedQuestionnaireAnswers(
            [],
            {},
            [{ key: "birthday", value: "1990-02-01" }],
        );

        expect(unmatched).toEqual([
            { key: "birthday", label: "Geburtsdatum", value: "01.02.1990" },
        ]);
    });
});

describe("description points", () => {
    it("does not copy a questionnaire value into Tätigkeiten", () => {
        const duties: DocumentSegment[] = [
            {
                type: "input",
                key: "contract.taetigkeiten",
                label: "Tätigkeit",
                fieldType: "points",
            },
        ];
        const answers = {
            firstName: "Ada",
            lastName: "Lovelace",
            birthday: "",
            street: "",
            city: "",
            postalCode: "",
            jobTitle: "Monteurin",
            children: [],
            priorEmployment: [],
        } as unknown as QuestionnaireAnswers;

        expect(contractValuesFromAnswers(duties, answers)).toEqual([]);
        expect(
            deterministicContractValues(duties, answers, "", [
                {
                    key: "jobTitle",
                    label: "Tätigkeit",
                    contractFieldKey: "contract.taetigkeiten",
                },
            ]),
        ).toEqual([]);
    });
});

describe("acceptModelMatches", () => {
    const fields = [{ key: "contract.iban" }, { key: "contract.steuer" }];
    const answers = [{ value: "DE89" }, { value: "123" }];

    it("keeps only keys on the template and values copied from the answers", () => {
        expect(
            acceptModelMatches(fields, answers, {
                matches: [
                    { key: "contract.iban", value: "DE89" },
                    { key: "contract.unknown", value: "DE89" },
                    { key: "contract.steuer", value: "erfunden" },
                    { key: "contract.iban", value: "123" },
                ],
            }),
        ).toEqual([{ key: "contract.iban", value: "DE89" }]);
    });
});

describe("questionnaire answer reuse", () => {
    it("keeps explicitly linked name parts available for a combined name field", () => {
        const answers = {
            firstName: "Lukas",
            lastName: "Muster",
            street: "",
            postalCode: "",
            city: "",
        } as QuestionnaireAnswers;
        expect(
            deterministicContractValues(
                [
                    {
                        type: "input",
                        key: "contract.vorname",
                        label: "Vorname",
                    },
                    { type: "input", key: "contract.name", label: "Name" },
                ],
                answers,
                "",
                [
                    {
                        key: "firstName",
                        label: "Vorname",
                        contractFieldKey: "contract.vorname",
                    },
                ],
            ),
        ).toEqual([
            { key: "contract.vorname", value: "Lukas" },
            { key: "contract.name", value: "Lukas Muster" },
        ]);
    });
    it("keeps historical custom answers visible even when their label is unavailable", () => {
        expect(
            unmatchedQuestionnaireAnswers([], {}, [
                { key: "custom.old-field", value: "Antwort" },
            ]),
        ).toEqual([
            {
                key: "custom.old-field",
                label: "custom.old-field",
                value: "Antwort",
            },
        ]);
    });
    it("excludes file answers from draggable contract text", () => {
        expect(
            unmatchedQuestionnaireAnswers(
                [],
                {},
                [{ key: "custom.upload", value: "stored-file" }],
                [{ key: "custom.upload", label: "Datei", type: "file" }],
            ),
        ).toEqual([]);
    });
});

it("matches a custom-only questionnaire without requiring removed personal-data fields", () => {
    expect(
        deterministicContractValues(
            [{ type: "input", key: "contract.schicht", label: "Schicht" }],
            {
                "custom.shift-choice": "Früh",
            } as unknown as QuestionnaireAnswers,
            "",
            [{ key: "custom.shift-choice", label: "Schicht" }],
        ),
    ).toEqual([{ key: "contract.schicht", value: "Früh" }]);
});
