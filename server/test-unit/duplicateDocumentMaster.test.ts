import { prisma } from "@/lib/prisma";
import {
    copiedDocumentName,
    duplicateDocumentMaster,
} from "@/services/documentMaster.service";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        documentMaster: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
        },
    },
}));

const body = { segments: [{ type: "text", text: "Vertrag" }] };

beforeEach(() => jest.clearAllMocks());

it("names the first copy and then numbers later copies", () => {
    expect(copiedDocumentName("Saisonvertrag", [])).toBe("Saisonvertrag (Kopie)");
    expect(
        copiedDocumentName("Saisonvertrag", ["Saisonvertrag (Kopie)"]),
    ).toBe("Saisonvertrag (Kopie 2)");
});

it("copies a contract without making the copy the primary template", async () => {
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        kind: "employment_contract",
        name: "Saisonvertrag",
        body,
        sourceKey: "originals/contract.docx",
        sourceMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sourceName: "contract.docx",
    });
    (prisma.documentMaster.findMany as jest.Mock).mockResolvedValue([
        { name: "Saisonvertrag" },
    ]);
    (prisma.documentMaster.create as jest.Mock).mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
            id: "copy-1",
            revision: 1,
            approvedAt: null,
            updatedAt: new Date("2026-10-20"),
            ...data,
        }),
    );

    const copy = await duplicateDocumentMaster("master-1", "org");

    expect(prisma.documentMaster.create).toHaveBeenCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({
                organizationId: "org",
                kind: "employment_contract",
                name: "Saisonvertrag (Kopie)",
                isPrimary: false,
                body,
                sourceKey: "originals/contract.docx",
            }),
        }),
    );
    expect(copy).toMatchObject({
        id: "copy-1",
        name: "Saisonvertrag (Kopie)",
        isPrimary: false,
        text: "Vertrag",
    });
});
