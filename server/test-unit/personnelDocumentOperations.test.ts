const mockSend = jest.fn().mockResolvedValue({});
const mockTx = {
    worker: { findFirst: jest.fn(), update: jest.fn() },
    workerDocument: { findFirst: jest.fn(), delete: jest.fn() },
    engagementPersonnelFolder: { findFirst: jest.fn(), delete: jest.fn() },
    engagementPersonnelDocument: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
    },
};
jest.mock("@/lib/prisma", () => ({
    prisma: {
        workerEngagement: { findFirst: jest.fn() },
        engagementPersonnelFolder: { findFirst: jest.fn() },
        $transaction: jest.fn((callback) => callback(mockTx)),
    },
}));
jest.mock("@/config/aws", () => ({
    generatePresignedUrl: jest.fn(),
    uploadFileToS3: jest.fn(),
}));
jest.mock("@aws-sdk/client-s3", () => ({
    S3Client: jest.fn(() => ({ send: mockSend })),
    DeleteObjectCommand: jest.fn((input) => input),
}));

import { prisma } from "@/lib/prisma";
import {
    deletePersonnelFolder,
    movePersonnelDocument,
} from "@/services/personnelDocument.service";

const scope = { organizationId: "org", workerId: "worker" };
beforeEach(() => {
    jest.clearAllMocks();
    mockTx.worker.findFirst.mockResolvedValue({
        id: "worker",
        hiddenPersonnelFolders: [],
    });
    mockTx.engagementPersonnelFolder.findFirst.mockResolvedValue({
        id: "folder",
        engagementId: "engagement",
    });
    mockTx.engagementPersonnelDocument.findMany.mockResolvedValue([]);
    jest.mocked(prisma.workerEngagement.findFirst).mockResolvedValue({
        id: "engagement",
    } as never);
    jest.mocked(prisma.engagementPersonnelFolder.findFirst).mockResolvedValue({
        id: "folder",
    } as never);
});

it("requires confirmation before deleting a populated folder", async () => {
    mockTx.engagementPersonnelDocument.findMany.mockResolvedValue([
        { id: "document", fileUrl: "key" },
    ]);
    await expect(
        deletePersonnelFolder({
            ...scope,
            folderId: "folder",
            confirmed: false,
        }),
    ).rejects.toThrow("Bitte das Löschen bestätigen");
    expect(
        mockTx.engagementPersonnelDocument.deleteMany,
    ).not.toHaveBeenCalled();
    expect(mockTx.engagementPersonnelFolder.delete).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
});

it("deletes folder contents and storage objects after confirmation", async () => {
    mockTx.engagementPersonnelDocument.findMany.mockResolvedValue([
        { id: "document", fileUrl: "key" },
    ]);
    await deletePersonnelFolder({
        ...scope,
        folderId: "folder",
        confirmed: true,
    });
    expect(mockTx.engagementPersonnelFolder.findFirst).toHaveBeenCalledWith({
        where: { id: "folder", engagement: scope },
    });
    expect(mockTx.engagementPersonnelDocument.deleteMany).toHaveBeenCalledWith({
        where: { engagement: scope, folderId: "folder" },
    });
    expect(mockTx.engagementPersonnelFolder.delete).toHaveBeenCalledWith({
        where: { id: "folder" },
    });
    expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ Key: "key" }),
    );
});

it("persists deletion of default folders", async () => {
    await deletePersonnelFolder({
        ...scope,
        folderId: "builtin:personalausweis",
        confirmed: false,
    });
    expect(mockTx.worker.update).toHaveBeenCalledWith({
        where: { id: "worker" },
        data: { hiddenPersonnelFolders: { push: "personalausweis" } },
    });
    expect(mockTx.engagementPersonnelFolder.delete).not.toHaveBeenCalled();
});

it("rejects folders outside the worker's organization", async () => {
    mockTx.engagementPersonnelFolder.findFirst.mockResolvedValue(null);
    await expect(
        deletePersonnelFolder({
            ...scope,
            folderId: "foreign",
            confirmed: true,
        }),
    ).rejects.toThrow("Ordner nicht gefunden");
    expect(
        mockTx.engagementPersonnelDocument.deleteMany,
    ).not.toHaveBeenCalled();
});

it("moves a personnel file without uploading or deleting its storage object", async () => {
    mockTx.engagementPersonnelDocument.findFirst.mockResolvedValue({
        id: "document",
        engagementId: "engagement",
    });
    await movePersonnelDocument({
        ...scope,
        documentId: "document",
        engagementId: "engagement",
        name: "ordner",
        folderId: "folder",
    });
    expect(mockTx.engagementPersonnelDocument.update).toHaveBeenCalledWith({
        where: { id: "document" },
        data: {
            name: "ordner",
            folderId: "folder",
            engagementId: "engagement",
        },
    });
    expect(mockSend).not.toHaveBeenCalled();
});

it("moves legacy uploads into the personnel library preserving metadata", async () => {
    const legacy = {
        id: "legacy",
        uploadedByUserId: "user",
        name: "test.pdf",
        fileUrl: "key",
        mimeType: "application/pdf",
        fileSizeBytes: 42,
        createdAt: new Date(),
    };
    mockTx.workerDocument.findFirst.mockResolvedValue(legacy);
    await movePersonnelDocument({
        ...scope,
        documentId: "legacy",
        source: "worker",
        engagementId: "engagement",
        name: "ordner",
        folderId: "folder",
    });
    expect(mockTx.workerDocument.findFirst).toHaveBeenCalledWith({
        where: { id: "legacy", worker: scope },
    });
    expect(mockTx.engagementPersonnelDocument.create).toHaveBeenCalledWith({
        data: {
            engagementId: "engagement",
            name: "ordner",
            folderId: "folder",
            uploadedByUserId: "user",
            originalFileName: "test.pdf",
            fileUrl: "key",
            mimeType: "application/pdf",
            fileSizeBytes: 42,
            createdAt: legacy.createdAt,
        },
    });
    expect(mockTx.workerDocument.delete).toHaveBeenCalledWith({
        where: { id: "legacy" },
    });
    expect(mockSend).not.toHaveBeenCalled();
});

it("rejects a move when the target engagement is not owned by the worker", async () => {
    jest.mocked(prisma.workerEngagement.findFirst).mockResolvedValue(null);
    await expect(
        movePersonnelDocument({
            ...scope,
            documentId: "document",
            engagementId: "foreign",
            name: "personalausweis",
        }),
    ).rejects.toThrow("Engagement nicht gefunden");
    expect(mockTx.engagementPersonnelDocument.update).not.toHaveBeenCalled();
});
