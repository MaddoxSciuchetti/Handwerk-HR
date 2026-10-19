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

    it("accepts Herr or Frau only on a salutation field", () => {
        expect(
            acceptModelMatches(
                [
                    { key: "contract.anrede", label: "Anrede" },
                    { key: "contract.iban", label: "IBAN" },
                ],
                [{ value: "Max" }],
                {
                    matches: [
                        { key: "contract.anrede", value: "Herr" },
                        { key: "contract.iban", value: "Herr" },
                        { key: "contract.anrede", value: "Maximilian" },
                    ],
                },
            ),
        ).toEqual([{ key: "contract.anrede", value: "Herr" }]);
    });

    it("stores a copied ja on a checkbox and a german date from an ISO copy", () => {
        expect(
            acceptModelMatches(
                [
                    { key: "contract.accepted", type: "checkbox" },
                    { key: "contract.birthday", type: "date" },
                ],
                [{ value: "ja" }, { value: "01.04.1990" }],
                {
                    matches: [
                        { key: "contract.accepted", value: "ja" },
                        { key: "contract.birthday", value: "1990-04-01" },
                    ],
                },
            ),
        ).toEqual([
            { key: "contract.accepted", value: "true" },
            { key: "contract.birthday", value: "01.04.1990" },
        ]);
    });
});

describe("questionnaire answer reuse", () => {
    it("copies only the contract field the questionnaire binds directly", () => {
        const answers = {
            firstName: "Lukas",
            lastName: "Muster",
            otherJobs: "ja",
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
                    {
                        type: "input",
                        key: "contract.accepted",
                        label: "Angenommen",
                        fieldType: "checkbox",
                    },
                ],
                answers,
                "",
                [
                    {
                        key: "firstName",
                        label: "Vorname",
                        contractFieldKey: "contract.vorname",
                    },
                    {
                        key: "otherJobs",
                        label: "Weitere Beschäftigungen",
                        contractFieldKey: "contract.accepted",
                    },
                ],
            ),
        ).toEqual([
            { key: "contract.vorname", value: "Lukas" },
            { key: "contract.accepted", value: "true" },
        ]);
    });

    it("fills a salutation from Geschlecht and leaves divers empty", () => {
        const segments = [
            { type: "input" as const, key: "contract.anrede", label: "Anrede" },
        ];
        expect(
            deterministicContractValues(segments, { sex: "männlich" } as QuestionnaireAnswers),
        ).toEqual([{ key: "contract.anrede", value: "Herr" }]);
        expect(
            deterministicContractValues(segments, { sex: "weiblich" } as QuestionnaireAnswers),
        ).toEqual([{ key: "contract.anrede", value: "Frau" }]);
        expect(
            deterministicContractValues(segments, { sex: "divers" } as QuestionnaireAnswers),
        ).toEqual([]);
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

it("matches a custom answer only when the questionnaire binds that contract field", () => {
    const answers = {
        "custom.shift-choice": "Früh",
    } as unknown as QuestionnaireAnswers;
    const segments: DocumentSegment[] = [
        { type: "input", key: "contract.schicht", label: "Schicht" },
    ];
    expect(
        deterministicContractValues(segments, answers, "", [
            { key: "custom.shift-choice", label: "Schicht" },
        ]),
    ).toEqual([]);
    expect(
        deterministicContractValues(segments, answers, "", [
            {
                key: "custom.shift-choice",
                label: "Schicht",
                contractFieldKey: "contract.schicht",
            },
        ]),
    ).toEqual([{ key: "contract.schicht", value: "Früh" }]);
});
