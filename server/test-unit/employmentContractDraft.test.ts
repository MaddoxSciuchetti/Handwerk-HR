import {
    getEngagementContract,
    resyncEngagementContractFromQuestionnaire,
    saveEngagementContractDraft,
    sendFilledEmploymentContract,
} from "@/services/employmentContract.service";
import { prisma } from "@/lib/prisma";
import { fromSegments } from "../../shared/document";
import { sendPreparedDocument } from "@/services/preparedDocument";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        employmentContract: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findFirstOrThrow: jest.fn(),
            update: jest.fn(),
        },
        employmentContractValue: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        $transaction: jest.fn(),
        documentMaster: { findFirst: jest.fn() },
        issue: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        issueAuditLog: { create: jest.fn() },
        worker: { findFirst: jest.fn() },
        preparedDocument: { findFirst: jest.fn() },
    },
}));
jest.mock("@/services/preparedDocument", () => ({
    invalidatePreparedDocuments: jest.fn(),
    outgoingPdfUrl: jest.fn().mockResolvedValue(null),
    currentPreparation: jest.fn().mockResolvedValue(null),
    DeliveryRejected: class extends Error {},
    sendPreparedDocument: jest.fn(),
}));
jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
jest.mock("@/services/graphMail", () => ({ sendGraphMail: jest.fn() }));
jest.mock("@/config/aws", () => ({ generatePresignedUrl: jest.fn() }));

const params = {
    organizationId: "org",
    workerId: "worker",
    engagementId: "eng",
};
const body = fromSegments([
    { type: "input", key: "contract.vorname", label: "Vorname" },
    { type: "input", key: "contract.vorname", label: "Name nochmal" },
]);
let contract: any;
beforeEach(() => {
    jest.clearAllMocks();
    contract = {
        id: "contract",
        engagementId: "eng",
        masterId: "master",
        status: "draft",
        body: null,
        fileUrl: null,
        outgoingPdfId: null,
        sentAt: null,
        master: { name: "Vertrag", body },
        values: [],
        engagement: { questionnaireSubmission: null },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma),
    );
    for (const method of [
        "findFirst",
        "findUnique",
        "findFirstOrThrow",
    ] as const)
        (prisma.employmentContract[method] as jest.Mock).mockImplementation(
            async () => contract,
        );
    (prisma.employmentContractValue.deleteMany as jest.Mock).mockImplementation(
        async () => {
            contract.values = [];
        },
    );
    (prisma.employmentContractValue.createMany as jest.Mock).mockImplementation(
        async ({ data }) => {
            contract.values = data;
        },
    );
    (prisma.employmentContract.update as jest.Mock).mockImplementation(
        async ({ data }) => {
            Object.assign(contract, data);
            return contract;
        },
    );
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue(null);
});
it("points an unsent contract at the marked master before it can be sent", async () => {
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        id: "primary-master",
    });

    await getEngagementContract(params);

    expect(prisma.employmentContract.update).toHaveBeenCalledWith({
        where: { id: "contract" },
        data: {
            masterId: "primary-master",
            body: expect.anything(),
            status: "draft",
            matchedMasterRevision: null,
        },
    });
});

it("keeps a sent contract on the master it was sent with", async () => {
    contract.sentAt = new Date();
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        id: "primary-master",
    });

    await getEngagementContract(params);

    expect(prisma.documentMaster.findFirst).not.toHaveBeenCalled();
    expect(prisma.employmentContract.update).not.toHaveBeenCalled();
});

it("persists a manual correction across closing/reopening and field movement without changing the master", async () => {
    await saveEngagementContractDraft({
        ...params,
        values: { "contract.vorname": "Jörg Müller" },
    });
    const moved = structuredClone(body);
    moved.content.content![0].content!.reverse();
    contract.master.body = moved;
    const reopened = await getEngagementContract(params);
    expect(reopened?.values).toEqual({ "contract.vorname": "Jörg Müller" });
    expect(reopened?.document).toEqual(moved);
    expect(reopened?.followsMaster).toBe(true);
    expect(body.content.content![0].content![0].attrs?.key).toBe(
        "contract.vorname",
    );
});
it("keeps sent/signed snapshots locked and rejects foreign keys", async () => {
    await expect(
        saveEngagementContractDraft({
            ...params,
            values: { foreign: "value" },
        }),
    ).rejects.toThrow("gehört nicht");
    contract.status = "signed";
    contract.signedBody = {
        version: 2,
        segments: [{ type: "text", text: "Signed historical snapshot" }],
    };
    const before = structuredClone(contract.signedBody);
    await expect(
        saveEngagementContractDraft({
            ...params,
            values: { "contract.vorname": "Changed" },
        }),
    ).rejects.toThrow("kein Entwurf");
    expect(contract.signedBody).toEqual(before);
});

it("replaces contract values from the Fragebogen and drops removed fields", async () => {
    contract.master = {
        name: "Vertrag",
        revision: 4,
        body: fromSegments([
            { type: "input", key: "contract.nachname", label: "Nachname" },
        ]),
    };
    contract.matchedMasterRevision = 2;
    contract.values = [
        { key: "contract.gehalt", value: "4000" },
        { key: "contract.nachname", value: "Alt" },
    ];
    contract.engagement = {
        questionnaireSubmission: {
            status: "completed",
            answers: [
                { key: "lastName", value: "Lovelace" },
                { key: "firstName", value: "Ada" },
            ],
        },
        worker: { email: "ada@example.com" },
    };

    const view = await resyncEngagementContractFromQuestionnaire(params);

    expect(prisma.employmentContractValue.deleteMany).toHaveBeenCalled();
    expect(prisma.employmentContractValue.createMany).toHaveBeenCalledWith({
        data: [
            {
                employmentContractId: "contract",
                key: "contract.nachname",
                value: "Lovelace",
            },
        ],
    });
    expect(view.values).toEqual({ "contract.nachname": "Lovelace" });
    expect(view.matchedMasterRevision).toBe(4);
    expect(view.masterRevision).toBe(4);
});

it("refuses to resync a contract that was already sent", async () => {
    contract.sentAt = new Date();
    contract.engagement = {
        questionnaireSubmission: {
            status: "completed",
            answers: [{ key: "lastName", value: "Lovelace" }],
        },
        worker: { email: "ada@example.com" },
    };

    await expect(
        resyncEngagementContractFromQuestionnaire(params),
    ).rejects.toThrow("bereits versendet");
    expect(prisma.employmentContractValue.deleteMany).not.toHaveBeenCalled();
});

describe("contract send task status", () => {
    const sendParams = {
        ...params,
        actorUserId: "actor",
        issueId: "send-task",
        artifactId: "pdf",
    };

    beforeEach(() => {
        (prisma.issue.findFirst as jest.Mock).mockResolvedValue({ id: "send-task" });
        (prisma.worker.findFirst as jest.Mock).mockResolvedValue({ email: "ada@example.com" });
        (prisma.preparedDocument.findFirst as jest.Mock).mockResolvedValue({ id: "pdf" });
        (prisma.issue.findMany as jest.Mock).mockResolvedValue([
            { id: "contract-task", status: "open" },
        ]);
        (sendPreparedDocument as jest.Mock).mockImplementation(async ({ finalize }) => {
            await finalize(prisma, body, {}, "pdf", "provider-id");
        });
    });

    it("starts the engagement's open Arbeitsvertrag task after successful delivery and records the change", async () => {
        await sendFilledEmploymentContract(sendParams);

        expect(prisma.issue.findMany).toHaveBeenCalledWith({
            where: {
                workerEngagementId: "eng",
                title: "Arbeitsvertrag",
                kind: "standard",
                status: "open",
            },
        });
        expect(prisma.issue.update).toHaveBeenCalledWith({
            where: { id: "contract-task" },
            data: { status: "in_progress" },
        });
        expect(prisma.issueAuditLog.create).toHaveBeenCalledWith({
            data: {
                issueId: "contract-task",
                actorUserId: "actor",
                action: "issue.updated",
                oldValue: { status: "open" },
                newValue: { status: "in_progress" },
            },
        });
        expect(prisma.issue.deleteMany).toHaveBeenCalledWith({ where: { id: "send-task" } });
    });

    it("leaves task status and send task unchanged when delivery fails", async () => {
        (sendPreparedDocument as jest.Mock).mockRejectedValue(new Error("Delivery failed"));
        await expect(sendFilledEmploymentContract(sendParams)).rejects.toThrow("Delivery failed");
        expect(prisma.issue.update).not.toHaveBeenCalled();
        expect(prisma.issueAuditLog.create).not.toHaveBeenCalled();
        expect(prisma.issue.deleteMany).not.toHaveBeenCalled();
    });

    it("does not change tasks or add audit entries if no open contract task remains", async () => {
        (prisma.issue.findMany as jest.Mock).mockResolvedValue([]);
        await sendFilledEmploymentContract(sendParams);
        expect(prisma.issue.update).not.toHaveBeenCalled();
        expect(prisma.issueAuditLog.create).not.toHaveBeenCalled();
        expect(prisma.issue.deleteMany).toHaveBeenCalledWith({ where: { id: "send-task" } });
    });
});
