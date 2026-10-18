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

it("uses context and reuses a placed choice for complementary checkboxes and matches vocational education", async () => {
    modelResult([
        match("contract.fixed", "custom.kind", "true"),
        match("contract.permanent", "custom.kind", "false"),
        match(
            "contract.degree",
            "custom.degree",
            "Anerkannte Berufsausbildung",
        ),
        match("contract.kind", "custom.kind", "false"),
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
    ).toBe(false);
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
    "preserves deterministic values and the sidebar on %s",
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
        expect(result).toEqual([{ key: "contract.kind", value: "Befristet" }]);
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

it("skips AI when there is no key or no unfilled field", async () => {
    delete process.env.OPENAI_API_KEY;
    expect(
        await matchQuestionnaireToContract(segments, answers, "", fields),
    ).toEqual([{ key: "contract.kind", value: "Befristet" }]);
    process.env.OPENAI_API_KEY = "test-key";
    await matchQuestionnaireToContract([segments[0]], answers, "", fields);
    expect(fetchMock).not.toHaveBeenCalled();
});
