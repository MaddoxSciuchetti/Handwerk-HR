import {
    completeMockQuestionnaire,
    mockQuestionnaireValues,
} from "@/services/questionnaireMock";
import {
    getPublicQuestionnaire,
    storeQuestionnaireFile,
    submitPublicQuestionnaire,
} from "@/services/questionnaire.service";
import {
    definitionFields,
    definitionRepeaters,
    seedQuestionnaireDefinition,
} from "@/services/questionnaireDefinition";
import { questionnaireAnswerSchema } from "@/services/questionnaireForm";

jest.mock("@/services/questionnaire.service", () => ({
    getPublicQuestionnaire: jest.fn(),
    storeQuestionnaireFile: jest.fn(),
    submitPublicQuestionnaire: jest.fn(),
}));
beforeEach(() => jest.resetAllMocks());

it("produces valid answers for the complete built-in questionnaire", () => {
    const definition = seedQuestionnaireDefinition();
    const fields = definitionFields(definition);
    const values = mockQuestionnaireValues(
        fields,
        "lukas.muster+test@example.test",
    );
    const answers = questionnaireAnswerSchema(
        fields,
        definitionRepeaters(definition).map((item) => item.key),
    ).parse(values);
    expect(answers).toMatchObject({
        firstName: "Lukas",
        lastName: "Muster",
        street: "Musterstraße 12",
        birthday: "1990-04-01",
        jobTitle: "Anlagenmechaniker",
    });
});

it("respects prefilled values, custom choices and field lengths", () => {
    const fields = [
        { key: "firstName", type: "text", defaultValue: "Vorausgefüllt" },
        { key: "custom.choice", type: "single", options: ["Spät", "Früh"] },
        { key: "custom.check", type: "check", options: ["Montage", "Büro"] },
        { key: "custom.short", type: "text", max: 4 },
    ];
    expect(mockQuestionnaireValues(fields, "test@example.test")).toEqual({
        firstName: "Vorausgefüllt",
        "custom.choice": "Spät",
        "custom.check": "Montage",
        "custom.short": "Test",
    });
});

it("submits through the real completion entry point and attaches a PDF for a required file", async () => {
    (getPublicQuestionnaire as jest.Mock).mockResolvedValue({
        status: "sent",
        questions: [
            { key: "firstName", type: "text" },
            { key: "custom.license", type: "file", required: true },
            { key: "custom.optional", type: "file", required: false },
        ],
    });
    (storeQuestionnaireFile as jest.Mock).mockResolvedValue({
        value: "stored-fixture",
    });
    await completeMockQuestionnaire("token", "lukas@example.test");
    expect(storeQuestionnaireFile).toHaveBeenCalledTimes(1);
    const [token, file] = (storeQuestionnaireFile as jest.Mock).mock.calls[0];
    expect(token).toBe("token");
    expect(file.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(file.mimetype).toBe("application/pdf");
    expect(submitPublicQuestionnaire).toHaveBeenCalledWith("token", {
        firstName: "Lukas",
        "custom.license": "stored-fixture",
        "custom.optional": "",
    });
});

it("does not regenerate a questionnaire already completed", async () => {
    (getPublicQuestionnaire as jest.Mock).mockResolvedValue({
        status: "completed",
    });
    await completeMockQuestionnaire("token", "lukas@example.test");
    expect(storeQuestionnaireFile).not.toHaveBeenCalled();
    expect(submitPublicQuestionnaire).not.toHaveBeenCalled();
});
