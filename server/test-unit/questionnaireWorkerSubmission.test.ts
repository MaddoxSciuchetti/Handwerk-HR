import { getPublicQuestionnaire, submitPublicQuestionnaire } from "@/services/questionnaire.service";
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
    await expect(submitPublicQuestionnaire("token", { ...body, declaration: "ja" })).resolves.toEqual({
        status: "completed",
    });
    expect(prisma.questionnaireAnswer.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([{ submissionId: "submission", key: "declaration", value: "ja" }]),
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

it.each(["", "BSB-Wert"])(
    "protects a BSB-only answer (%s) while accepting a worker submission",
    async (preset) => {
        jest.clearAllMocks();
        (
            prisma.questionnaireSubmission.findUnique as jest.Mock
        ).mockResolvedValue({
            id: "submission",
            engagementId: "engagement",
            status: "sent",
            formDefinition: {
                items: [
                    {
                        kind: "field",
                        key: "custom.bsb-salary",
                        label: "BSB-Angabe",
                        type: "text",
                        required: true,
                        bsbOnly: true,
                        defaultValue: preset,
                    },
                    {
                        kind: "field",
                        key: "custom.worker-name",
                        label: "Angabe",
                        type: "text",
                        required: true,
                    },
                ],
            },
            engagement: {
                workerId: "worker",
                responsibleUserId: "user",
                worker: { email: "worker@example.test" },
                employmentContract: null,
            },
        });
        (
            prisma.questionnaireSubmission.updateMany as jest.Mock
        ).mockResolvedValue({ count: 1 });
        (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
            callback(prisma),
        );
        await expect(
            submitPublicQuestionnaire("token", {
                declaration: "ja",
                "custom.bsb-salary": "Vom Empfänger geändert",
                "custom.worker-name": "Muster",
            }),
        ).resolves.toEqual({ status: "completed" });
        expect(prisma.questionnaireAnswer.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                {
                    submissionId: "submission",
                    key: "custom.worker-name",
                    value: "Muster",
                },
            ]),
        });
        const stored = (prisma.questionnaireAnswer.createMany as jest.Mock).mock
            .calls[0][0].data;
        expect(
            stored.find(
                (entry: { key: string }) => entry.key === "custom.bsb-salary",
            )?.value ?? "",
        ).toBe(preset);
        expect(stored).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({ value: "Vom Empfänger geändert" }),
            ]),
        );
    },
);

it("publishes BSB-only fields as locked and optional in both public form representations", async () => {
    (prisma.questionnaireSubmission.findUnique as jest.Mock).mockResolvedValue({
        status: "sent",
        formDefinition: {
            items: [
                {
                    kind: "field",
                    key: "custom.bsb-salary",
                    label: "Gehalt",
                    type: "text",
                    required: true,
                    bsbOnly: true,
                },
            ],
        },
    });
    const payload = await getPublicQuestionnaire("token");
    expect(payload).toMatchObject({
        questions: expect.arrayContaining([
            expect.objectContaining({
                key: "custom.bsb-salary",
                required: false,
                employerFilled: true,
                bsbOnly: true,
            }),
            expect.objectContaining({ key: "declaration", required: true }),
        ]),
        items: expect.arrayContaining([
            expect.objectContaining({
                key: "custom.bsb-salary",
                required: false,
                employerFilled: true,
                bsbOnly: true,
            }),
            expect.objectContaining({ key: "declaration", required: true }),
        ]),
    });
});

it.each([undefined, '', 'nein', true, 'true'])("rejects a submission without explicit declaration confirmation (%s)", async (declaration) => {
    (prisma.questionnaireSubmission.findUnique as jest.Mock).mockResolvedValue({ status: "sent" });
    const transactionCalls = (prisma.$transaction as jest.Mock).mock.calls.length;
    await expect(submitPublicQuestionnaire("token", { declaration })).rejects.toThrow("Bitte bestätigen Sie die Erklärung der beschäftigten Person.");
    expect(prisma.$transaction).toHaveBeenCalledTimes(transactionCalls);
});
