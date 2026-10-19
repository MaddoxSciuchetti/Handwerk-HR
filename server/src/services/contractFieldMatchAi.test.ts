import { matchQuestionnaireToContract } from "@/services/contractFieldMatchAi";
import type { DocumentSegment } from "@/services/documentBody";
import type { QuestionnaireAnswers } from "@/services/questionnaireForm";

const segments: DocumentSegment[] = [
    { type: "input", key: "contract.vorname", label: "Vorname des Arbeitnehmers" },
    { type: "input", key: "contract.name", label: "Name" },
    { type: "input", key: "contract.iban", label: "Bankverbindung IBAN" },
    {
        type: "input",
        key: "contract.duties",
        label: "Tätigkeiten",
        fieldType: "points",
    },
];

const answers = {
    firstName: "Ada",
    lastName: "Lovelace",
    iban: "DE89",
    jobTitle: "Monteurin",
} as QuestionnaireAnswers;

describe("matchQuestionnaireToContract", () => {
    const previousKey = process.env.OPENAI_API_KEY;

    afterEach(() => {
        jest.restoreAllMocks();
        if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = previousKey;
    });

    it("keeps a direct questionnaire binding and asks the model for the remaining fields", async () => {
        process.env.OPENAI_API_KEY = "test-key";
        const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                matches: [
                                    { key: "contract.vorname", value: "Monteurin" },
                                    { key: "contract.iban", value: "DE89" },
                                    { key: "contract.name", value: "Ada Lovelace" },
                                    { key: "contract.duties", value: "Monteurin" },
                                ],
                            }),
                        },
                    },
                ],
            }),
        } as Response);

        const result = await matchQuestionnaireToContract(segments, answers, "ada@example.test", [
            {
                key: "firstName",
                label: "Vorname",
                contractFieldKey: "contract.vorname",
            },
            { key: "lastName", label: "Familienname" },
            { key: "iban", label: "IBAN" },
            { key: "jobTitle", label: "Berufsbezeichnung" },
        ]);

        const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
        const payload = JSON.parse(request.messages[1].content) as {
            fields: { key: string }[];
            answers: { key: string; value: string }[];
        };
        expect(payload.fields.map((field) => field.key)).toEqual([
            "contract.name",
            "contract.iban",
        ]);
        expect(payload.answers.map((answer) => answer.key)).not.toContain("firstName");
        expect(payload.answers).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ key: "iban", value: "DE89" }),
                expect.objectContaining({
                    key: "composed.fullName",
                    value: "Ada Lovelace",
                }),
            ]),
        );
        expect(result).toEqual([
            { key: "contract.vorname", value: "Ada" },
            { key: "contract.iban", value: "DE89" },
            { key: "contract.name", value: "Ada Lovelace" },
        ]);
    });

    it("returns only direct bindings when no model key is configured", async () => {
        delete process.env.OPENAI_API_KEY;
        const fetchMock = jest.spyOn(global, "fetch");
        await expect(
            matchQuestionnaireToContract(segments, answers, "", [
                {
                    key: "iban",
                    label: "IBAN",
                    contractFieldKey: "contract.iban",
                },
            ]),
        ).resolves.toEqual([{ key: "contract.iban", value: "DE89" }]);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fills Anrede from Geschlecht without asking the model", async () => {
        process.env.OPENAI_API_KEY = "test-key";
        const fetchMock = jest.spyOn(global, "fetch");
        await expect(
            matchQuestionnaireToContract(
                [{ type: "input", key: "contract.anrede", label: "Anrede" }],
                { sex: "weiblich", firstName: "Ada" } as QuestionnaireAnswers,
            ),
        ).resolves.toEqual([{ key: "contract.anrede", value: "Frau" }]);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("lets the model set Anrede from the first name when Geschlecht does not decide it", async () => {
        process.env.OPENAI_API_KEY = "test-key";
        const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                matches: [{ key: "contract.anrede", value: "Herr" }],
                            }),
                        },
                    },
                ],
            }),
        } as Response);

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
        expect(payload.fields.map((field) => field.key)).toEqual(["contract.anrede"]);
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
});
