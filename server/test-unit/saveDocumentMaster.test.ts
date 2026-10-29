import { prisma } from "@/lib/prisma";
import { generatePresignedUrl } from "@/config/aws";
import { updateDocumentMaster } from "@/services/documentMaster.service";
import { fromSegments } from "../../shared/document";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        documentMaster: {
            findFirst: jest.fn(),
            updateManyAndReturn: jest.fn(),
        },
    },
}));
jest.mock("@/config/aws", () => ({ generatePresignedUrl: jest.fn() }));

const document = fromSegments([{ type: "text", text: "Updated contract" }]);
const input = {
    id: "master", organizationId: "org", name: "Contract",
    document, revision: 3, approved: true,
};

beforeEach(() => jest.resetAllMocks());

it("returns the committed revision without rereading or signing the original upload", async () => {
    jest.mocked(prisma.documentMaster.findFirst).mockResolvedValue({ id: "master", revision: 3 } as any);
    jest.mocked(prisma.documentMaster.updateManyAndReturn).mockResolvedValue([{
        id: "master", name: "Contract", kind: "employment_contract", isPrimary: true,
        body: document, revision: 4, approvedAt: new Date(), updatedAt: new Date(),
        sourceMime: "application/pdf",
    }] as any);
    jest.mocked(generatePresignedUrl).mockRejectedValue(new Error("Expired storage credentials"));

    const saved = await updateDocumentMaster(input);

    expect(saved).toMatchObject({ id: "master", revision: 4, document });
    expect(prisma.documentMaster.findFirst).not.toHaveBeenCalled();
    expect(generatePresignedUrl).not.toHaveBeenCalled();
    expect(prisma.documentMaster.updateManyAndReturn).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "master", organizationId: "org", revision: 3, deletedAt: null },
        data: expect.objectContaining({ revision: { increment: 1 }, body: document }),
    }));
});

it("rejects a stale revision without claiming the document was saved", async () => {
    jest.mocked(prisma.documentMaster.findFirst).mockResolvedValue({ id: "master", revision: 4 } as any);
    jest.mocked(prisma.documentMaster.updateManyAndReturn).mockResolvedValue([]);
    await expect(updateDocumentMaster(input)).rejects.toThrow("inzwischen geändert");
});

it("rejects a missing or inaccessible master without saving", async () => {
    jest.mocked(prisma.documentMaster.findFirst).mockResolvedValue(null);
    jest.mocked(prisma.documentMaster.updateManyAndReturn).mockResolvedValue([]);
    await expect(updateDocumentMaster(input)).rejects.toThrow("nicht gefunden");
});

it("still uses optimistic concurrency for callers without a revision", async () => {
    jest.mocked(prisma.documentMaster.findFirst).mockResolvedValue({ revision: 5 } as any);
    jest.mocked(prisma.documentMaster.updateManyAndReturn).mockResolvedValue([{
        id: "master", name: "Contract", kind: "employment_contract", isPrimary: false,
        body: document, revision: 6, approvedAt: null, updatedAt: new Date(),
    }] as any);
    await expect(updateDocumentMaster({ ...input, revision: undefined })).resolves.toMatchObject({ revision: 6 });
    expect(prisma.documentMaster.updateManyAndReturn).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ revision: 5 }),
    }));
});
