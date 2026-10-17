import {
    getQuestionnaireDraft,
    sendEngagementQuestionnaire,
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
        workerEngagement: { findFirst: jest.fn() },
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
