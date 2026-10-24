import {
    getQuestionnaireDraft,
    sendEngagementQuestionnaire,
    saveQuestionnaireDraft,
} from "@/services/questionnaireDispatch";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/utils/sendMail";
import { completeMockQuestionnaire } from "@/services/questionnaireMock";
import { questionnaireForOrganization } from "@/services/questionnaireTemplate";
import { primaryEmploymentContract } from "@/services/documentMaster.service";
import { seedQuestionnaireDefinition } from "@/services/questionnaireDefinition";

jest.mock("@/constants/env", () => ({
    FRONTENDURL: "http://localhost:5173",
    QUESTIONNAIRE_MOCK_RESPONSES: false,
}));
jest.mock("@/lib/prisma", () => ({
    prisma: {
        workerEngagement: { findFirst: jest.fn(), update: jest.fn() },
        questionnaireSubmission: { create: jest.fn() },
        issue: { createMany: jest.fn() },
        employmentContract: { create: jest.fn() },
        $transaction: jest.fn(),
    },
}));
jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
jest.mock("@/services/questionnaireMock", () => ({
    completeMockQuestionnaire: jest.fn(),
}));
jest.mock("@/services/questionnaireTemplate", () => ({
    questionnaireForOrganization: jest.fn(),
    employmentContractFields: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/services/documentMaster.service", () => ({
    primaryEmploymentContract: jest.fn(),
}));
const flags = jest.requireMock("@/constants/env");
const params = {
    organizationId: "org",
    engagementId: "engagement",
    createdByUserId: "user",
};
let engagement: any;
beforeEach(() => {
    jest.resetAllMocks();
    flags.QUESTIONNAIRE_MOCK_RESPONSES = false;
    jest.requireMock("@/services/questionnaireTemplate").employmentContractFields.mockResolvedValue([]);
    engagement = {
        id: "engagement",
        worker: { id: "worker", email: "lukas@example.test" },
        questionnaireSubmission: null,
        questionnaireOverrides: null,
    };
    (prisma.workerEngagement.findFirst as jest.Mock).mockImplementation(
        async () => engagement,
    );
    (questionnaireForOrganization as jest.Mock).mockResolvedValue(
        seedQuestionnaireDefinition(),
    );
    (primaryEmploymentContract as jest.Mock).mockResolvedValue({
        id: "master",
    });
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma),
    );
    (sendMail as jest.Mock).mockResolvedValue({ error: null });
});

it("keeps real delivery unchanged when the flag is off", async () => {
    expect(await sendEngagementQuestionnaire(params)).toMatchObject({
        emailSent: true,
        mockCompleted: false,
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(completeMockQuestionnaire).not.toHaveBeenCalled();
});

it("includes the print task alongside the signed-contract task before a reply arrives", async () => {
    await sendEngagementQuestionnaire(params);
    expect(prisma.issue.createMany).toHaveBeenCalledWith({
        data: [
            expect.objectContaining({ title: "Fragebogen", status: "in_progress" }),
            expect.objectContaining({
                workerEngagementId: "engagement",
                createdByUserId: "user",
                title: "Arbeitsvertrag drucken",
                status: "open",
                kind: "contract_send",
                isTemporary: true,
            }),
            expect.objectContaining({ title: "Arbeitsvertrag unterschrieben", status: "open" }),
        ],
    });
});

it("creates the normal questionnaire and contract before simulating the reply, without emailing", async () => {
    flags.QUESTIONNAIRE_MOCK_RESPONSES = true;
    (completeMockQuestionnaire as jest.Mock).mockImplementation(async () => {
        expect(prisma.questionnaireSubmission.create).toHaveBeenCalled();
        expect(prisma.employmentContract.create).toHaveBeenCalled();
    });
    expect(await sendEngagementQuestionnaire(params)).toEqual({
        emailSent: false,
        mockCompleted: true,
        engagementId: "engagement",
    });
    expect(completeMockQuestionnaire).toHaveBeenCalledWith(
        expect.any(String),
        "lukas@example.test",
    );
    expect(sendMail).not.toHaveBeenCalled();
    expect((await getQuestionnaireDraft(params)).mockEnabled).toBe(true);
});

it("can finish a previously sent questionnaire without recreating tasks or the contract", async () => {
    flags.QUESTIONNAIRE_MOCK_RESPONSES = true;
    engagement.questionnaireSubmission = {
        token: "existing-token",
        status: "sent",
    };
    await sendEngagementQuestionnaire(params);
    expect(completeMockQuestionnaire).toHaveBeenCalledWith(
        "existing-token",
        "lukas@example.test",
    );
    expect(prisma.issue.createMany).not.toHaveBeenCalled();
    expect(prisma.employmentContract.create).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
});

it("reports a failed simulated submission instead of claiming success", async () => {
    flags.QUESTIONNAIRE_MOCK_RESPONSES = true;
    (completeMockQuestionnaire as jest.Mock).mockRejectedValue(
        new Error("Storage unavailable"),
    );
    await expect(sendEngagementQuestionnaire(params)).rejects.toThrow(
        "Storage unavailable",
    );
    expect(sendMail).not.toHaveBeenCalled();
});

it("persists an engagement definition and dispatches it without changing the organization template", async () => {
    const template = seedQuestionnaireDefinition();
    const local = {
        name: template.name,
        items: [
            { kind: "field", key: "custom.12345678", label: "Nur dieser Einsatz", section: "Weitere Angaben", type: "text", required: false },
            { ...template.items.find((item) => item.key === "firstName"), label: "Angepasster Vorname", contractFieldKey: "firstName" },
        ],
    };
    (prisma.workerEngagement.update as jest.Mock).mockImplementation(async ({ data }) => {
        engagement.questionnaireOverrides = data.questionnaireOverrides;
        return engagement;
    });
    const saved = await saveQuestionnaireDraft({ ...params, definition: local, values: { firstName: "Lukas" }, questions: [] });
    expect(saved.items.map((item) => item.key)).toEqual(["custom.12345678", "firstName"]);
    expect(saved.items[1]).toMatchObject({ label: "Angepasster Vorname", defaultValue: "Lukas", contractFieldKey: "firstName" });
    // A later template change must not replace the engagement's saved questions.
    (questionnaireForOrganization as jest.Mock).mockResolvedValue({ ...template, name: "Neue Vorlage" });
    expect((await getQuestionnaireDraft(params)).items).toEqual(saved.items);
    await sendEngagementQuestionnaire(params);
    expect(prisma.questionnaireSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ formDefinition: expect.objectContaining({ items: saved.items }) }),
    }));
    expect(template.items[0]).not.toHaveProperty("defaultValue");
    expect(template.items[0]).not.toHaveProperty("contractFieldKey");
    expect(template.items).toHaveLength(seedQuestionnaireDefinition().items.length);
});

it.each([false, true])("uses the saved sender for questionnaire delivery (resend: %s)", async (resend) => {
    engagement.questionnaireSenderAddress = "office@example.test";
    if (resend) engagement.questionnaireSubmission = { token: "existing-token", status: "sent" };
    await sendEngagementQuestionnaire(params);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: "lukas@example.test",
        senderAddress: "office@example.test",
    }));
});

it('overrides a legacy saved sender with the staging default on retry', async () => {
    engagement.questionnaireSubmission = { id: 'submission', token: 'retry-token', status: 'sent' };
    engagement.questionnaireSenderAddress = 'old@example.test';
    jest.spyOn(require('@/services/questionnaireSender'), 'defaultQuestionnaireSender').mockReturnValue('hello@example.test');
    (sendMail as jest.Mock).mockResolvedValue({ data: { id: 'mail' }, error: null });
    try {
        await sendEngagementQuestionnaire(params);
        expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ senderAddress: 'hello@example.test', to: 'lukas@example.test' }));
    } finally { jest.restoreAllMocks(); }
});
