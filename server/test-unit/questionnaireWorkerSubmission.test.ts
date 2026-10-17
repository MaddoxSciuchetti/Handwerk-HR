import { submitPublicQuestionnaire } from "@/services/questionnaire.service";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        questionnaireSubmission: {
            findUnique: jest.fn(),
            updateMany: jest.fn(),
        },
        questionnaireAnswer: { createMany: jest.fn() },
        worker: { update: jest.fn() },
        issue: { updateMany: jest.fn() },
        $transaction: jest.fn(),
    },
}));
jest.mock("@/config/aws", () => ({ uploadFileToS3: jest.fn() }));
jest.mock("@/services/questionnaireFiles.service", () => ({
    fileQuestionnaireAnswers: jest.fn(),
}));
jest.mock("@/services/employmentContract.service", () => ({
    persistMatchedContractValues: jest.fn(),
}));
jest.mock("@/services/contractFieldMatchAi", () => ({
    matchQuestionnaireToContract: jest.fn(),
}));

it("persists the worker information fields when a questionnaire is completed", async () => {
    const body = {
        firstName: "Lukas",
        lastName: "Muster",
        birthday: "1992-03-04",
        street: "Musterstraße 12",
        postalCode: "10115",
        city: "Berlin",
        entryDate: "2026-11-01",
        jobTitle: "Monteur",
    };
    (prisma.questionnaireSubmission.findUnique as jest.Mock).mockResolvedValue({
        id: "submission",
        engagementId: "engagement",
        status: "sent",
        formDefinition: {
            items: Object.keys(body).map((key) => ({ kind: "field", key })),
        },
        engagement: {
            workerId: "worker",
            responsibleUserId: "user",
            worker: { email: "lukas@example.test" },
            employmentContract: null,
        },
    });
    (prisma.questionnaireSubmission.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
    });
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma),
    );
    await expect(submitPublicQuestionnaire("token", body)).resolves.toEqual({
        status: "completed",
    });
    expect(prisma.worker.update).toHaveBeenCalledWith({
        where: { id: "worker" },
        data: {
            firstName: "Lukas",
            lastName: "Muster",
            birthday: new Date("1992-03-04T00:00:00Z"),
            street: "Musterstraße 12",
            postalCode: "10115",
            city: "Berlin",
            entryDate: new Date("2026-11-01T00:00:00Z"),
            position: "Monteur",
        },
    });
});
