import { prisma } from "@/lib/prisma";
import {
    deleteDocumentMaster,
    primaryEmploymentContract,
    listDocumentMasters,
    setPrimaryDocumentMaster,
} from "@/services/documentMaster.service";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        documentMaster: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            updateMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        employmentContract: { count: jest.fn() },
        arbeitszeugnis: { count: jest.fn() },
        automationDocumentSetting: { count: jest.fn(), deleteMany: jest.fn() },
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
            deletedAt: null,
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
        where: { id: "next", deletedAt: null },
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

it("removes even an in-use template from the library without deleting historical records", async () => {
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({ id: "used" });
    await deleteDocumentMaster("used", "org");
    expect(prisma.documentMaster.updateMany).toHaveBeenCalledWith({
        where: { id: "used", organizationId: "org", deletedAt: null },
        data: { deletedAt: expect.any(Date), isPrimary: false },
    });
    expect(prisma.automationDocumentSetting.deleteMany).toHaveBeenCalledWith({
        where: { organizationId: "org", documentMasterId: "used" },
    });
    expect(prisma.documentMaster.delete).not.toHaveBeenCalled();
    expect(prisma.employmentContract.count).not.toHaveBeenCalled();
});

it("hides removed templates from the library and from primary fallback selection", async () => {
    (prisma.documentMaster.findMany as jest.Mock).mockResolvedValue([]);
    await expect(listDocumentMasters("org")).resolves.toEqual([]);
    expect(prisma.documentMaster.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { organizationId: "org", deletedAt: null },
    }));
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue(null);
    await primaryEmploymentContract("org");
    expect(prisma.documentMaster.findFirst).toHaveBeenLastCalledWith({
        where: { organizationId: "org", kind: "employment_contract", deletedAt: null },
        orderBy: { updatedAt: "desc" },
    });
});

it("does not remove another organization's template", async () => {
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(deleteDocumentMaster("foreign", "org")).rejects.toThrow("Dokument nicht gefunden");
    expect(prisma.documentMaster.updateMany).not.toHaveBeenCalled();
});
