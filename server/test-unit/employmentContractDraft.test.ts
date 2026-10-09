import {
    getEngagementContract,
    saveEngagementContractDraft,
} from "@/services/employmentContract.service";
import { prisma } from "@/lib/prisma";
import { fromSegments } from "../../shared/document";

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
    },
}));
jest.mock("@/services/preparedDocument", () => ({
    invalidatePreparedDocuments: jest.fn(),
    outgoingPdfUrl: jest.fn().mockResolvedValue(null),
    currentPreparation: jest.fn().mockResolvedValue(null),
    DeliveryRejected: class extends Error {},
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
