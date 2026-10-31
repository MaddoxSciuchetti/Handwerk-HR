import { matchQuestionnaireToContract } from "@/services/contractFieldMatchAi";
import {
    acceptSemanticModelMatches,
    unmatchedQuestionnaireAnswers,
} from "@/services/contractFieldMatch";
import type { DocumentSegment } from "@/services/documentBody";
import type { QuestionnaireAnswers } from "@/services/questionnaireForm";

const fields = [
    { key: "custom.kind", label: "Arbeitsverhältnis" },
    { key: "custom.degree", label: "Höchste Berufsausbildung" },
    { key: "custom.other", label: "Zusätzlicher Hinweis" },
];
const answers = {
    "custom.kind": "Befristet",
    "custom.degree": "Anerkannte Berufsausbildung",
    "custom.other": "Nur für die Personalakte",
} as unknown as QuestionnaireAnswers;
const segments: DocumentSegment[] = [
    { type: "input", key: "contract.kind", label: "Arbeitsverhältnis" },
    { type: "text", text: "in einem " },
    {
        type: "input",
        key: "contract.fixed",
        label: "Kontrollkästchen 1",
        fieldType: "checkbox",
    },
    { type: "text", text: " befristeten Arbeitsverhältnis oder " },
    {
        type: "input",
        key: "contract.permanent",
        label: "Kontrollkästchen 2",
        fieldType: "checkbox",
    },
    {
        type: "text",
        text: " unbefristeten Arbeitsverhältnis. Beruflicher Abschluss: ",
    },
    { type: "input", key: "contract.degree", label: "Beruflicher Abschluss" },
    { type: "input", key: "contract.unrelated", label: "Stundenlohn" },
];
const match = (key: string, answerKey: string, value: string) => ({
    key,
    answerKey,
    value,
    confidence: "high",
});
const originalKey = process.env.OPENAI_API_KEY;
let fetchMock: jest.SpyInstance;
beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    fetchMock = jest.spyOn(globalThis, "fetch");
});
afterEach(() => {
    fetchMock.mockRestore();
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
});
function modelResult(matches: unknown[]) {
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
            choices: [{ message: { content: JSON.stringify({ matches }) } }],
        }),
    } as Response);
}

it("uses context for complementary checkboxes and matches vocational education via AI only", async () => {
    modelResult([
        match("contract.kind", "custom.kind", "Befristet"),
        match("contract.fixed", "custom.kind", "true"),
        match("contract.permanent", "custom.kind", "false"),
        match(
            "contract.degree",
            "custom.degree",
            "Anerkannte Berufsausbildung",
        ),
        match("contract.unrelated", "custom.other", "25 €"),
    ]);
    const result = await matchQuestionnaireToContract(
        segments,
        answers,
        "",
        fields,
    );
    expect(result).toEqual([
        { key: "contract.kind", value: "Befristet" },
        { key: "contract.fixed", value: "true" },
        { key: "contract.permanent", value: "false" },
        { key: "contract.degree", value: "Anerkannte Berufsausbildung" },
    ]);
    const input = JSON.parse(
        JSON.parse(fetchMock.mock.calls[0][1].body).messages[1].content,
    );
    expect(
        input.fields.find(
            (field: { key: string }) => field.key === "contract.fixed",
        ).context,
    ).toContain("befristeten Arbeitsverhältnis");
    expect(
        input.fields.some(
            (field: { key: string }) => field.key === "contract.kind",
        ),
    ).toBe(true);
    expect(input.answers).toContainEqual({
        key: "custom.kind",
        label: "Arbeitsverhältnis",
        value: "Befristet",
    });
    expect(
        unmatchedQuestionnaireAnswers(
            segments,
            Object.fromEntries(result.map((entry) => [entry.key, entry.value])),
            Object.entries(answers).map(([key, value]) => ({
                key,
                value: value as string,
            })),
            fields,
        ),
    ).toEqual([
        {
            key: "custom.other",
            label: "Zusätzlicher Hinweis",
            value: "Nur für die Personalakte",
        },
    ]);
});

it("defers categorical checkbox answers even when labels match exactly", async () => {
    modelResult([match("contract.kind", "custom.kind", "false")]);
    expect(
        await matchQuestionnaireToContract(
            [
                { type: "text", text: "Unbefristet: " },
                {
                    type: "input",
                    key: "contract.kind",
                    label: "Arbeitsverhältnis",
                    fieldType: "checkbox",
                },
            ],
            answers,
            "",
            fields,
        ),
    ).toEqual([{ key: "contract.kind", value: "false" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("can use vocational education for distinct contract checkbox choices", async () => {
    modelResult([
        match("contract.qualified", "custom.degree", "true"),
        match("contract.noqualification", "custom.degree", "false"),
    ]);
    expect(await matchQuestionnaireToContract([
        { type: "input", key: "contract.qualified", label: "Mit abgeschlossener Berufsausbildung", fieldType: "checkbox" },
        { type: "input", key: "contract.noqualification", label: "Ohne beruflichen Abschluss", fieldType: "checkbox" },
    ], answers, "", fields)).toEqual([
        { key: "contract.qualified", value: "true" },
        { key: "contract.noqualification", value: "false" },
    ]);
});

it("rejects unknown sources, uncertainty, invented text, invalid booleans and duplicate targets", () => {
    expect(
        acceptSemanticModelMatches(
            [{ key: "text" }, { key: "check", fieldType: "checkbox" }],
            [{ key: "source", value: "Befristet" }],
            {
                matches: [
                    match("check", "missing", "true"),
                    {
                        ...match("check", "source", "true"),
                        confidence: "uncertain",
                    },
                    match("check", "source", "Befristet"),
                    match("text", "source", "unbefristet"),
                    match("unknown", "source", "Befristet"),
                    match("text", "source", "Befristet"),
                    match("check", "source", "false"),
                    match("check", "source", "true"),
                ],
            },
        ),
    ).toEqual([
        { key: "text", value: "Befristet" },
        { key: "check", value: "false" },
    ]);
});

it.each(["failure", "invalid-json", "http-error", "no-match"])(
    "leaves fields empty when AI fails on %s (deterministic disabled)",
    async (mode) => {
        if (mode === "failure")
            fetchMock.mockRejectedValue(new Error("timeout"));
        else if (mode === "http-error")
            fetchMock.mockResolvedValue({ ok: false } as Response);
        else if (mode === "invalid-json")
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: "bad json" } }],
                }),
            } as Response);
        else modelResult([]);
        const result = await matchQuestionnaireToContract(
            segments,
            answers,
            "",
            fields,
        );
        expect(result).toEqual([]);
        expect(
            unmatchedQuestionnaireAnswers(
                segments,
                Object.fromEntries(
                    result.map((entry) => [entry.key, entry.value]),
                ),
                [
                    {
                        key: "custom.degree",
                        value: "Anerkannte Berufsausbildung",
                    },
                ],
                fields,
            ),
        ).toEqual([
            {
                key: "custom.degree",
                label: "Höchste Berufsausbildung",
                value: "Anerkannte Berufsausbildung",
            },
        ]);
    },
);

it("skips AI when there is no key", async () => {
    delete process.env.OPENAI_API_KEY;
    expect(
        await matchQuestionnaireToContract(segments, answers, "", fields),
    ).toEqual([]);
});

it("asks the model for Anrede (deterministic salutation disabled)", async () => {
    modelResult([
        {
            key: "contract.anrede",
            value: "Frau",
            answerKey: "sex",
            confidence: "high",
        },
    ]);
    await expect(
        matchQuestionnaireToContract(
            [{ type: "input", key: "contract.anrede", label: "Anrede" }],
            { sex: "weiblich", firstName: "Ada" } as QuestionnaireAnswers,
        ),
    ).resolves.toEqual([{ key: "contract.anrede", value: "Frau" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("fills Vorname by alias and asks the model only for Anrede", async () => {
    modelResult([
        {
            key: "contract.anrede",
            value: "Herr",
            answerKey: "firstName",
            confidence: "high",
        },
    ]);

    const result = await matchQuestionnaireToContract(
        [
            { type: "input", key: "contract.vorname", label: "Vorname" },
            { type: "input", key: "contract.anrede", label: "Anrede" },
        ],
        { firstName: "Max", sex: "divers" } as QuestionnaireAnswers,
        "",
        [
            {
                key: "firstName",
                label: "Vorname",
                contractFieldKey: "contract.vorname",
            },
        ],
    );

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const payload = JSON.parse(request.messages[1].content) as {
        instruction?: string;
        emptyFieldCount?: number;
        alreadyFilled?: { key: string; value: string }[];
        fields: { key: string }[];
        answers: { key: string; value: string }[];
    };
    expect(request.messages[0].content).toContain(
        "Befülle so viele noch leere Vertragsfelder wie möglich",
    );
    expect(request.messages[0].content).toContain('key „address“');
    expect(payload.instruction).toContain("Maximal befüllen");
    expect(payload.emptyFieldCount).toBe(1);
    expect(payload.alreadyFilled).toEqual([
        { key: "contract.vorname", value: "Max" },
    ]);
    expect(payload.fields.map((field) => field.key)).toEqual([
        "contract.anrede",
    ]);
    expect(payload.answers).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ key: "firstName", value: "Max" }),
            expect.objectContaining({ key: "sex", value: "divers" }),
        ]),
    );
    expect(result).toEqual([
        { key: "contract.vorname", value: "Max" },
        { key: "contract.anrede", value: "Herr" },
    ]);
});

it("gives the model section cues and wider context for leftover fields", async () => {
    modelResult([]);
    await matchQuestionnaireToContract(
        [
            {
                type: "text",
                text: "§ 3 Vergütung\nDas monatliche Bruttogehalt beträgt ",
            },
            { type: "input", key: "contract.salary", label: "Betrag" },
            { type: "text", text: " Euro." },
        ],
        { "custom.salary": "4200" } as unknown as QuestionnaireAnswers,
        "",
        [{ key: "custom.salary", label: "Monatsgehalt" }],
    );
    const payload = JSON.parse(
        JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).messages[1]
            .content,
    ) as {
        fields: {
            key: string;
            section: string;
            context: string;
            label: string;
        }[];
        answers: { key: string; value: string }[];
    };
    expect(payload.fields).toEqual([
        expect.objectContaining({
            key: "contract.salary",
            label: "Betrag",
            section: expect.stringContaining("§ 3 Vergütung"),
            context: expect.stringContaining("Bruttogehalt"),
        }),
    ]);
    expect(payload.answers).toContainEqual(
        expect.objectContaining({ key: "custom.salary", value: "4200" }),
    );
});

it("fills Adresse and every Nachname placeholder from questionnaire aliases", async () => {
    modelResult([]);
    const result = await matchQuestionnaireToContract(
        [
            { type: "text", text: "Zwischen … und " },
            { type: "input", key: "contract.anrede", label: "Anrede" },
            { type: "input", key: "contract.vorname", label: "Vorname" },
            { type: "input", key: "contract.nachname", label: "Nachname" },
            {
                type: "text",
                text: ", geboren am …, wohnhaft in ",
            },
            { type: "input", key: "contract.adresse", label: "adresse" },
            {
                type: "text",
                text: ". § 1 … 1. ",
            },
            { type: "input", key: "contract.anrede2", label: "Herr/Frau" },
            { type: "input", key: "contract.nachname2", label: "nachname" },
            { type: "text", text: " wird eingestellt." },
        ],
        {
            firstName: "Lukas",
            lastName: "Adler",
            street: "Beispielweg 4",
            postalCode: "10115",
            city: "Berlin",
            sex: "männlich",
        } as QuestionnaireAnswers,
    );
    expect(result).toEqual(
        expect.arrayContaining([
            { key: "contract.vorname", value: "Lukas" },
            { key: "contract.nachname", value: "Adler" },
            { key: "contract.nachname2", value: "Adler" },
            {
                key: "contract.adresse",
                value: "Beispielweg 4, 10115 Berlin",
            },
        ]),
    );
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const payload = JSON.parse(request.messages[1].content) as {
        fields: { key: string }[];
        answers: { key: string; value: string }[];
    };
    expect(payload.fields.map((field) => field.key).sort()).toEqual([
        "contract.anrede",
        "contract.anrede2",
    ]);
    expect(payload.answers).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                key: "address",
                value: "Beispielweg 4, 10115 Berlin",
            }),
            expect.objectContaining({
                key: "fullName",
                value: "Lukas Adler",
            }),
        ]),
    );
});

it("fills stunden_anzahl from the Mo–So day-hour sum without AI", async () => {
    modelResult([]);
    const result = await matchQuestionnaireToContract(
        [
            {
                type: "text",
                text: "Die durchschnittliche Arbeitszeit beträgt ",
            },
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
    );
    expect(result).toEqual([{ key: "stunden_anzahl", value: "40" }]);
    // Already filled by weekday sum — AI is not asked for leftover hours fields.
    expect(fetchMock).not.toHaveBeenCalled();
});

it("accepts the composed address answer for Adresse fields", () => {
    expect(
        acceptSemanticModelMatches(
            [{ key: "contract.adresse", label: "adresse" }],
            [
                {
                    key: "address",
                    value: "Beispielweg 4, 10115 Berlin",
                },
            ],
            {
                matches: [
                    {
                        key: "contract.adresse",
                        answerKey: "address",
                        value: "Beispielweg 4, 10115 Berlin",
                        confidence: "high",
                    },
                ],
            },
        ),
    ).toEqual([
        {
            key: "contract.adresse",
            value: "Beispielweg 4, 10115 Berlin",
        },
    ]);
});
