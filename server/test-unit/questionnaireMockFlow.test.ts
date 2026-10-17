import { sendEngagementQuestionnaire } from "@/services/questionnaireDispatch";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/utils/sendMail";
import { questionnaireForOrganization } from "@/services/questionnaireTemplate";
import { primaryEmploymentContract } from "@/services/documentMaster.service";
import { persistMatchedContractValues } from "@/services/employmentContract.service";
import { matchQuestionnaireToContract } from "@/services/contractFieldMatchAi";
import { deterministicContractValues } from "@/services/contractFieldMatch";
import { fromSegments } from "../../shared/document";

jest.mock("@/constants/env", () => ({
    FRONTENDURL: "http://localhost:5173",
    QUESTIONNAIRE_MOCK_RESPONSES: true,
}));
jest.mock("@/lib/prisma", () => ({
    prisma: {
        workerEngagement: { findFirst: jest.fn() },
        questionnaireSubmission: {
            create: jest.fn(),
            findUnique: jest.fn(),
            updateMany: jest.fn(),
        },
        questionnaireAnswer: { createMany: jest.fn() },
        employmentContract: { create: jest.fn() },
        worker: { update: jest.fn() },
        issue: {
            createMany: jest.fn(),
            create: jest.fn(),
            updateMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));
jest.mock("@/config/aws", () => ({ uploadFileToS3: jest.fn() }));
jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
jest.mock("@/services/questionnaireTemplate", () => ({
    questionnaireForOrganization: jest.fn(),
}));
jest.mock("@/services/documentMaster.service", () => ({
    primaryEmploymentContract: jest.fn(),
}));
jest.mock("@/services/employmentContract.service", () => ({
    persistMatchedContractValues: jest.fn(),
}));
jest.mock("@/services/contractFieldMatchAi", () => ({
    matchQuestionnaireToContract: jest.fn(),
}));
jest.mock("@/services/questionnaireFiles.service", () => ({
    fileQuestionnaireAnswers: jest.fn(),
}));

it("runs send -> simulated reply -> worker and contract updates -> print task, and tolerates replay", async () => {
    const master = {
        id: "master",
        revision: 1,
        body: fromSegments([
            { type: "input", key: "contract.name", label: "Name" },
            { type: "input", key: "contract.address", label: "Adresse" },
            { type: "input", key: "contract.birthday", label: "Geburtsdatum" },
        ]),
    };
    const engagement: any = {
        id: "engagement",
        workerId: "worker",
        responsibleUserId: "user",
        worker: { id: "worker", email: "lukas.muster@example.test" },
        questionnaireSubmission: null,
        employmentContract: null,
    };
    let submission: any;
    (questionnaireForOrganization as jest.Mock).mockResolvedValue({
        name: "Testfragebogen",
        intro: "",
        items: [
            "firstName",
            "lastName",
            "street",
            "postalCode",
            "city",
            "birthday",
            "jobTitle",
            "entryDate",
        ].map((key) => ({ kind: "field", key })),
    });
    (primaryEmploymentContract as jest.Mock).mockResolvedValue(master);
    (prisma.workerEngagement.findFirst as jest.Mock).mockResolvedValue(
        engagement,
    );
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma),
    );
    (prisma.questionnaireSubmission.create as jest.Mock).mockImplementation(
        async ({ data }) => {
            submission = { ...data, id: "submission", engagement };
            engagement.questionnaireSubmission = submission;
        },
    );
    (prisma.employmentContract.create as jest.Mock).mockImplementation(
        async ({ data }) => {
            engagement.employmentContract = { ...data, id: "contract", master };
        },
    );
    (prisma.questionnaireSubmission.findUnique as jest.Mock).mockImplementation(
        async () => submission,
    );
    (prisma.questionnaireSubmission.updateMany as jest.Mock).mockImplementation(
        async ({ data }) => {
            if (submission.status !== "sent") return { count: 0 };
            Object.assign(submission, data);
            return { count: 1 };
        },
    );
    (matchQuestionnaireToContract as jest.Mock).mockImplementation(
        async (...args) =>
            deterministicContractValues(
                ...(args as Parameters<typeof deterministicContractValues>),
            ),
    );
    const params = {
        organizationId: "org",
        engagementId: "engagement",
        createdByUserId: "user",
    };
    expect(await sendEngagementQuestionnaire(params)).toMatchObject({
        mockCompleted: true,
        emailSent: false,
    });
    expect(submission.status).toBe("completed");
    expect(prisma.questionnaireAnswer.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.worker.update).toHaveBeenCalledWith({
        where: { id: "worker" },
        data: expect.objectContaining({
            firstName: "Lukas",
            lastName: "Muster",
            birthday: new Date("1990-04-01"),
            street: "Musterstraße 12",
            position: "Anlagenmechaniker",
            entryDate: expect.any(Date),
        }),
    });
    expect(persistMatchedContractValues).toHaveBeenCalledWith(prisma, {
        contractId: "contract",
        masterRevision: 1,
        entries: expect.arrayContaining([
            { key: "contract.name", value: "Lukas Muster" },
            { key: "contract.address", value: "Musterstraße 12, 10115 Berlin" },
            { key: "contract.birthday", value: "01.04.1990" },
        ]),
    });
    expect(prisma.issue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
            kind: "contract_send",
            title: "Arbeitsvertrag drucken",
        }),
    });
    await sendEngagementQuestionnaire(params);
    expect(prisma.issue.create).toHaveBeenCalledTimes(1);
    expect(prisma.employmentContract.create).toHaveBeenCalledTimes(1);
    expect(sendMail).not.toHaveBeenCalled();
});
