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

it("lets the model fill Vorname and Anrede when deterministic links are off", async () => {
    modelResult([
        {
            key: "contract.vorname",
            value: "Max",
            answerKey: "firstName",
            confidence: "high",
        },
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
        fields: { key: string }[];
        answers: { key: string; value: string }[];
    };
    expect(request.messages[0].content).toContain("Ausnahme ist allein die Anrede");
    expect(payload.fields.map((field) => field.key)).toEqual([
        "contract.vorname",
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
