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

describe("questionnaire checkbox values", () => {
    const checkbox: DocumentSegment = {
        type: "input",
        key: "contract.confirmed",
        label: "Bestätigung",
        fieldType: "checkbox",
    };
    it.each([
        ["ja", "true"],
        ["nein", "false"],
        [" JA ", "true"],
        ["Nein", "false"],
    ])(
        "stores %s as %s for linked and label-matched checkboxes",
        (answer, expected) => {
            for (const linked of [false, true]) {
                expect(
                    deterministicContractValues(
                        [
                            checkbox,
                            {
                                type: "input",
                                key: "contract.text",
                                label: "Antwort als Text",
                            },
                        ],
                        {
                            "custom.confirmed": answer,
                            "custom.text": answer,
                        } as unknown as QuestionnaireAnswers,
                        "",
                        [
                            {
                                key: "custom.confirmed",
                                label: linked ? "Andere Frage" : "Bestätigung",
                                ...(linked
                                    ? { contractFieldKey: "contract.confirmed" }
                                    : {}),
                            },
                            { key: "custom.text", label: "Antwort als Text" },
                        ],
                    ),
                ).toEqual([
                    { key: "contract.confirmed", value: expected },
                    { key: "contract.text", value: answer.trim() },
                ]);
            }
        },
    );
    it.each([
        ["ja", "true"],
        ["nein", "false"],
    ])("normalizes validated model matches for %s", (answer, expected) => {
        const fields = [
            { key: "contract.confirmed", fieldType: "checkbox" },
            { key: "contract.text", fieldType: "text" },
        ];
        expect(
            acceptModelMatches(fields, [{ value: answer }], {
                matches: [
                    { key: "contract.confirmed", value: answer },
                    { key: "contract.text", value: answer },
                ],
            }),
        ).toEqual([
            { key: "contract.confirmed", value: expected },
            { key: "contract.text", value: answer },
        ]);
        expect(
            acceptModelMatches(fields, [{ value: answer }], {
                matches: [{ key: "contract.confirmed", value: expected }],
            }),
        ).toEqual([]);
    });
    it.each([
        ["ja", "true"],
        ["nein", "false"],
    ])(
        "removes a placed %s answer without consuming unrelated answers",
        (answer, expected) => {
            expect(
                unmatchedQuestionnaireAnswers(
                    [checkbox],
                    { "contract.confirmed": expected },
                    [
                        { key: "custom.confirmed", value: answer },
                        { key: "custom.other", value: answer },
                    ],
                    [
                        { key: "custom.confirmed", label: "Bestätigung" },
                        { key: "custom.other", label: "Andere Frage" },
                    ],
                ),
            ).toEqual([
                { key: "custom.other", label: "Andere Frage", value: answer },
            ]);
        },
    );
});

it.each([
    ["ja", "true"],
    ["nein", "false"],
])(
    "converts %s after matching a questionnaire answer through the model",
    async (answer, expected) => {
        const { matchQuestionnaireToContract } =
            await import("@/services/contractFieldMatchAi");
        const originalKey = process.env.OPENAI_API_KEY;
        process.env.OPENAI_API_KEY = "test-key";
        const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                matches: [
                                    {
                                        key: "contract.confirmed",
                                        value: expected,
                                        answerKey: "custom.confirmed",
                                        confidence: "high",
                                    },
                                ],
                            }),
                        },
                    },
                ],
            }),
        } as Response);
        try {
            expect(
                await matchQuestionnaireToContract(
                    [
                        {
                            type: "input",
                            key: "contract.confirmed",
                            label: "Zustimmung",
                            fieldType: "checkbox",
                        },
                    ],
                    {
                        "custom.confirmed": answer,
                    } as unknown as QuestionnaireAnswers,
                    "",
                    [{ key: "custom.confirmed", label: "Bestätigung" }],
                ),
            ).toEqual([{ key: "contract.confirmed", value: expected }]);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        } finally {
            fetchMock.mockRestore();
            if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
            else process.env.OPENAI_API_KEY = originalKey;
        }
    },
);
