import {
    acceptModelMatches,
    contractValuesFromAnswers,
    deterministicContractValues,
    resolveExclusiveCheckboxes,
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

it("maps Urlaubsanspruch and Gehalt questionnaire answers onto differently labelled contract fields", () => {
    expect(
        deterministicContractValues(
            [
                { type: "input", key: "contract.urlaubstage", label: "Urlaubstage" },
                { type: "input", key: "contract.gehalt", label: "Gehalt" },
            ],
            {
                "custom.urlaubsanspruch": "30",
                "custom.bsb-salary": "4200",
            } as unknown as QuestionnaireAnswers,
            "",
            [
                {
                    key: "custom.urlaubsanspruch",
                    label: "Urlaubsanspruch (Kalenderjahr)",
                },
                { key: "custom.bsb-salary", label: "Gehalt" },
            ],
        ),
    ).toEqual([
        { key: "contract.urlaubstage", value: "30" },
        { key: "contract.gehalt", value: "4200" },
    ]);
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

describe("reliable hours and repeated questionnaire matching", () => {
    const hours = (value: string) => ({ employmentExtent: value } as unknown as QuestionnaireAnswers);
    const fields = [{ key: "employmentExtent", label: "Wöchentliche Arbeitszeit" }];
    it.each(["Wochenstunden", "Arbeitszeit pro Woche", "Anzahl der Stunden", "Stundenzahl"])("copies weekly hours into %s", (label) => {
        expect(deterministicContractValues([{ type: "input", key: "contract.hours", label }], hours("37,5"), "", fields))
            .toEqual([{ key: "contract.hours", value: "37,5" }]);
    });
    it("fills repeated placeholders with the same questionnaire answer", () => {
        expect(deterministicContractValues([
            { type: "input", key: "contract.hours", label: "Wochenstunden" },
            { type: "input", key: "contract.hoursAgain", label: "Anzahl der Stunden" },
        ], hours("40"), "", fields)).toEqual([
            { key: "contract.hours", value: "40" }, { key: "contract.hoursAgain", value: "40" },
        ]);
    });
    it("reuses non-hours answers across repeated contract fields", () => {
        expect(deterministicContractValues([
            { type: "input", key: "contract.vacation", label: "Urlaubstage" },
            { type: "input", key: "contract.vacationAgain", label: "Urlaubsanspruch" },
        ], { "custom.vacation": "30" } as unknown as QuestionnaireAnswers, "", [{ key: "custom.vacation", label: "Urlaubsanspruch" }]))
            .toEqual([{ key: "contract.vacation", value: "30" }, { key: "contract.vacationAgain", value: "30" }]);
    });
    it.each(["Vollzeit", "Teilzeit", ""])("does not invent numeric hours from %s", (value) => {
        expect(deterministicContractValues([{ type: "input", key: "contract.hours", label: "Anzahl der Stunden" }], hours(value), "", fields)).toEqual([]);
    });
    it.each(["Stundenlohn", "Stunden pro Tag", "Monatsstunden", "Überstunden"])("does not put weekly hours into %s", (label) => {
        expect(deterministicContractValues([{ type: "input", key: "contract.hours", label }], hours("40"), "", fields)).toEqual([]);
    });
    it("uses surrounding text to distinguish daily from weekly hours", () => {
        expect(deterministicContractValues([
            { type: "text", text: "Die tägliche Arbeitszeit beträgt " },
            { type: "input", key: "contract.hours", label: "Anzahl der Stunden" },
            { type: "text", text: " Stunden." },
        ], hours("40"), "", fields)).toEqual([]);
    });
    it("leaves conflicting questionnaire values empty rather than taking the first", () => {
        expect(deterministicContractValues([{ type: "input", key: "contract.hours", label: "Anzahl der Stunden" }], {
            "custom.a": "35", "custom.b": "40",
        } as unknown as QuestionnaireAnswers, "", [
            { key: "custom.a", label: "Wochenstunden" }, { key: "custom.b", label: "Wöchentliche Arbeitszeit" },
        ])).toEqual([]);
    });
    it("keeps hourly pay separate from monthly salary", () => {
        expect(deterministicContractValues([{ type: "input", key: "contract.pay", label: "Stundenlohn" }], {
            "custom.salary": "4200",
        } as unknown as QuestionnaireAnswers, "", [{ key: "custom.salary", label: "Gehalt" }])).toEqual([]);
    });
});

it("copies weekly hours into stunden_anzahl from context and weekday totals", () => {
    expect(
        deterministicContractValues(
            [
                { type: "text", text: "Die durchschnittliche Arbeitszeit beträgt " },
                {
                    type: "input",
                    key: "stunden_anzahl",
                    label: "stunden_anzahl",
                },
                { type: "text", text: " Stunden pro Woche." },
            ],
            {
                employmentExtent: "Vollzeit",
                hoursMonday: "8",
                hoursTuesday: "8",
                hoursWednesday: "8",
                hoursThursday: "8",
                hoursFriday: "8",
            } as unknown as QuestionnaireAnswers,
            "",
            [
                { key: "employmentExtent", label: "Wöchentliche Arbeitszeit" },
                { key: "hoursMonday", label: "Mo" },
                { key: "hoursTuesday", label: "Di" },
                { key: "hoursWednesday", label: "Mi" },
                { key: "hoursThursday", label: "Do" },
                { key: "hoursFriday", label: "Fr" },
            ],
        ),
    ).toEqual([{ key: "stunden_anzahl", value: "40" }]);
});

it("does not put ja/nein into Gehalt or other euro amount fields", () => {
    expect(
        deterministicContractValues(
            [
                {
                    type: "input",
                    key: "lohn_gehalt",
                    label: "Lohn/Gehalt/Grundentgelt",
                },
                {
                    type: "input",
                    key: "brutto_insgesamt",
                    label: "Brutto-Arbeitsentgelt insgesamt",
                },
            ],
            {
                "custom.probezeit": "ja",
                "custom.bsb-salary": "ja",
            } as unknown as QuestionnaireAnswers,
            "",
            [
                { key: "custom.probezeit", label: "Probezeit" },
                { key: "custom.bsb-salary", label: "Gehalt" },
            ],
        ),
    ).toEqual([]);
});

it("clears exclusive je Stunde / je Monat checkboxes when both were checked", () => {
    expect(
        deterministicContractValues(
            [
                { type: "text", text: "Brutto-Arbeitsentgelt je Stunde " },
                {
                    type: "input",
                    key: "pay.hour",
                    label: "je Stunde",
                    fieldType: "checkbox",
                },
                { type: "text", text: " / je Monat " },
                {
                    type: "input",
                    key: "pay.month",
                    label: "je Monat",
                    fieldType: "checkbox",
                },
            ],
            {
                "custom.hour": "ja",
                "custom.month": "ja",
            } as unknown as QuestionnaireAnswers,
            "",
            [
                {
                    key: "custom.hour",
                    label: "je Stunde",
                    contractFieldKey: "pay.hour",
                },
                {
                    key: "custom.month",
                    label: "je Monat",
                    contractFieldKey: "pay.month",
                },
            ],
        ),
    ).toEqual([
        { key: "pay.hour", value: "false" },
        { key: "pay.month", value: "false" },
    ]);
});

it("keeps monthly pay period when the clause says monatliche", () => {
    expect(
        resolveExclusiveCheckboxes(
            [
                { type: "text", text: "folgendes monatliche Brutto-Arbeitsentgelt je Stunde " },
                {
                    type: "input",
                    key: "pay.hour",
                    label: "je Stunde",
                    fieldType: "checkbox",
                },
                { type: "text", text: " / je Monat " },
                {
                    type: "input",
                    key: "pay.month",
                    label: "je Monat",
                    fieldType: "checkbox",
                },
            ],
            [
                { key: "pay.hour", value: "true" },
                { key: "pay.month", value: "true" },
            ],
        ),
    ).toEqual([
        { key: "pay.hour", value: "false" },
        { key: "pay.month", value: "true" },
    ]);
});

it("maps Dauer der Probezeit onto anzahl_probezeit and drops a repeated unit", () => {
    expect(
        deterministicContractValues(
            [
                { type: "text", text: "Die ersten " },
                {
                    type: "input",
                    key: "anzahl_probezeit",
                    label: "anzahl_probezeit",
                },
                { type: "text", text: " Monate gelten als Probezeit." },
            ],
            {
                "custom.probezeit": "ja",
                "custom.probezeit-dauer": "6 Monate",
            } as unknown as QuestionnaireAnswers,
            "",
            [
                {
                    key: "custom.probezeit",
                    label: "Probezeit",
                    type: "single",
                },
                {
                    key: "custom.probezeit-dauer",
                    label: "Dauer der Probezeit",
                },
            ],
        ),
    ).toEqual([{ key: "anzahl_probezeit", value: "6" }]);
});

it("does not put the Probezeit ja/nein answer into an Anzahl field", () => {
    expect(
        deterministicContractValues(
            [
                {
                    type: "input",
                    key: "anzahl_probezeit",
                    label: "anzahl_probezeit",
                },
            ],
            { "custom.probezeit": "ja" } as unknown as QuestionnaireAnswers,
            "",
            [{ key: "custom.probezeit", label: "Probezeit", type: "single" }],
        ),
    ).toEqual([]);
});

it("hides Dauer der Probezeit once the quantity was written into the contract", () => {
    expect(
        unmatchedQuestionnaireAnswers(
            [
                {
                    type: "input",
                    key: "anzahl_probezeit",
                    label: "anzahl_probezeit",
                },
            ],
            { anzahl_probezeit: "6" },
            [{ key: "custom.probezeit-dauer", value: "6 Monate" }],
            [
                {
                    key: "custom.probezeit-dauer",
                    label: "Dauer der Probezeit",
                },
            ],
        ),
    ).toEqual([]);
});

it("does not confuse an unspecified quantity with daily hours", () => {
    expect(deterministicContractValues([{ type: "input", key: "contract.hours", label: "Stunden pro Tag" }],
        { "custom.hours": "8" } as unknown as QuestionnaireAnswers, "", [{ key: "custom.hours", label: "Anzahl der Stunden" }])).toEqual([]);
});
it("does not treat daily questionnaire hours as a weekly contract quantity", () => {
    expect(deterministicContractValues([{ type: "input", key: "contract.hours", label: "Anzahl der Stunden" }],
        { hoursMonday: "8" } as unknown as QuestionnaireAnswers, "", [{ key: "hoursMonday", label: "Mo" }])).toEqual([]);
});
it("rejects impossible weekly hours instead of automatically inserting them", () => {
    expect(deterministicContractValues([{ type: "input", key: "contract.hours", label: "Wochenstunden" }],
        { employmentExtent: "200" } as unknown as QuestionnaireAnswers, "", [{ key: "employmentExtent", label: "Wöchentliche Arbeitszeit" }])).toEqual([]);
});
