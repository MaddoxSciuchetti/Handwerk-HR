import { parseMaterialLines } from "@/services/engagementMaterialExtract";
import { OPENAI_API_KEY } from "@/constants/env";
import { uploadFileToS3, generatePresignedUrl } from "@/config/aws";
import { prisma } from "@/lib/prisma";
import { uploadEngagementMaterial } from "@/services/engagementMaterial.service";
import AppError from "@/utils/AppError";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        workerEngagement: { findFirst: jest.fn() },
        $transaction: jest.fn(),
    },
}));

jest.mock("@/config/aws", () => ({
    uploadFileToS3: jest.fn(),
    generatePresignedUrl: jest.fn(),
}));

const findEngagement = prisma.workerEngagement.findFirst as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;
const uploadToS3 = uploadFileToS3 as jest.Mock;
const presign = generatePresignedUrl as jest.Mock;

const file = {
    originalname: "rechnung.pdf",
    mimetype: "application/pdf",
    size: 1200,
    buffer: Buffer.from("pdf"),
} as Express.Multer.File;

describe("engagement materials", () => {
    const originalKey = process.env.OPENAI_API_KEY;

    afterEach(() => {
        process.env.OPENAI_API_KEY = originalKey;
    });

    it("loads without requiring OPENAI_API_KEY at startup", () => {
        expect(typeof OPENAI_API_KEY).toBe("string");
    });

    it("rejects an upload when the key is missing", async () => {
        delete process.env.OPENAI_API_KEY;
        findEngagement.mockResolvedValue({ id: "eng-1" });
        uploadToS3.mockResolvedValue({ success: true, key: "upload/key" });
        const fetchSpy = jest.spyOn(global, "fetch").mockRejectedValue(new Error("should not call"));

        await expect(
            uploadEngagementMaterial({
                organizationId: "org-1",
                workerId: "worker-1",
                engagementId: "eng-1",
                file,
            }),
        ).rejects.toBeInstanceOf(AppError);

        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it("stores a line list from the model as material rows", async () => {
        process.env.OPENAI_API_KEY = "test-key";
        findEngagement.mockResolvedValue({ id: "eng-1" });
        uploadToS3.mockResolvedValue({
            success: true,
            key: "upload/engagement-materials/eng-1/file",
        });
        presign.mockResolvedValue("https://signed.example/file");

        const createDocument = jest.fn().mockResolvedValue({
            id: "doc-1",
            name: "rechnung.pdf",
            mimeType: "application/pdf",
            fileSizeBytes: 1200,
            createdAt: new Date("2026-10-09T00:00:00.000Z"),
            fileUrl: "upload/engagement-materials/eng-1/file",
        });
        const createMaterial = jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({
                id: `mat-${data.name}`,
                ...data,
                unitPrice: { toString: () => data.unitPrice.toFixed(2) },
            }),
        );
        transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
            fn({
                engagementMaterialDocument: { create: createDocument },
                engagementMaterial: { create: createMaterial },
            }),
        );

        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                items: [
                                    {
                                        name: "Hammer",
                                        articleNumber: "H-1",
                                        quantity: 2,
                                        unitPrice: 12.9,
                                    },
                                    {
                                        name: "   ",
                                        articleNumber: "skip",
                                        quantity: 1,
                                        unitPrice: 1,
                                    },
                                    {
                                        name: "Nägel",
                                        articleNumber: "",
                                        quantity: "4",
                                        unitPrice: "3,50",
                                    },
                                ],
                            }),
                        },
                    },
                ],
            }),
        });
        global.fetch = fetchMock as unknown as typeof fetch;

        const result = await uploadEngagementMaterial({
            organizationId: "org-1",
            workerId: "worker-1",
            engagementId: "eng-1",
            file,
        });

        expect(createMaterial).toHaveBeenCalledTimes(2);
        expect(createMaterial).toHaveBeenNthCalledWith(1, {
            data: {
                engagementId: "eng-1",
                sourceDocumentId: "doc-1",
                name: "Hammer",
                articleNumber: "H-1",
                quantity: 2,
                unitPrice: 12.9,
            },
        });
        expect(createMaterial).toHaveBeenNthCalledWith(2, {
            data: {
                engagementId: "eng-1",
                sourceDocumentId: "doc-1",
                name: "Nägel",
                articleNumber: "",
                quantity: 4,
                unitPrice: 3.5,
            },
        });
        expect(result.document.materials).toHaveLength(2);
        expect(result.document.presignedUrl).toBe("https://signed.example/file");
    });
});

describe("parseMaterialLines", () => {
    it("reads German prices and skips blank names", () => {
        expect(
            parseMaterialLines({
                items: [
                    { name: "Säge", articleNumber: "S1", quantity: 1, unitPrice: "1.234,50" },
                    { name: "", articleNumber: "x", quantity: 1, unitPrice: 1 },
                ],
            }),
        ).toEqual([
            {
                name: "Säge",
                articleNumber: "S1",
                quantity: 1,
                unitPrice: 1234.5,
            },
        ]);
    });
});
