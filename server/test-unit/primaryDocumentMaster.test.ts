import { prisma } from "@/lib/prisma";
import {
    primaryEmploymentContract,
    setPrimaryDocumentMaster,
} from "@/services/documentMaster.service";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        documentMaster: {
            findFirst: jest.fn(),
            updateMany: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));
jest.mock("@/config/aws", () => ({
    generatePresignedUrl: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma),
    );
});

it("uses the marked employment contract instead of the latest template", async () => {
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "marked",
        kind: "employment_contract",
        isPrimary: true,
    });

    await expect(primaryEmploymentContract("org")).resolves.toMatchObject({
        id: "marked",
    });
    expect(prisma.documentMaster.findFirst).toHaveBeenCalledWith({
        where: {
            organizationId: "org",
            kind: "employment_contract",
            isPrimary: true,
        },
    });
});

it("marks one employment contract and clears the previous mark", async () => {
    (prisma.documentMaster.findFirst as jest.Mock)
        .mockResolvedValueOnce({
            id: "next",
            kind: "employment_contract",
            isPrimary: false,
        })
        .mockResolvedValueOnce({
            id: "next",
            name: "Saisonvertrag",
            kind: "employment_contract",
            isPrimary: true,
            body: { type: "doc", content: [] },
            revision: 1,
            approvedAt: null,
            sourceKey: null,
            sourceMime: null,
            updatedAt: new Date("2026-10-13"),
        });

    const saved = await setPrimaryDocumentMaster("next", "org");

    expect(prisma.documentMaster.updateMany).toHaveBeenCalledWith({
        where: {
            organizationId: "org",
            kind: "employment_contract",
            isPrimary: true,
        },
        data: { isPrimary: false },
    });
    expect(prisma.documentMaster.update).toHaveBeenCalledWith({
        where: { id: "next" },
        data: { isPrimary: true },
    });
    expect(saved.isPrimary).toBe(true);
    expect(saved.id).toBe("next");
});

it("rejects marking an Arbeitszeugnis as the contract template", async () => {
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        id: "letter",
        kind: "arbeitszeugnis",
        isPrimary: false,
    });

    await expect(setPrimaryDocumentMaster("letter", "org")).rejects.toThrow(
        "Nur ein Arbeitsvertrag",
    );
    expect(prisma.documentMaster.update).not.toHaveBeenCalled();
});
