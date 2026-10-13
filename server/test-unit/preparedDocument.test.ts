import { createHash } from "node:crypto";
import { fromSegments } from "../../shared/document";
import {
    sendPreparedDocument,
    prepareDocument,
    DeliveryRejected,
} from "@/services/preparedDocument";
import { prisma } from "@/lib/prisma";
import { downloadStoredFile, uploadFileToS3 } from "@/config/aws";
import { generateDocumentPdf } from "@/services/documentPdf";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        preparedDocument: {
            findFirst: jest.fn(),
            updateMany: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        documentMaster: { findFirst: jest.fn() },
        $queryRaw: jest.fn(),
        $transaction: jest.fn(),
        employmentContract: { findUnique: jest.fn() },
        arbeitszeugnis: { findUnique: jest.fn() },
        automationDocumentSetting: { findUnique: jest.fn() },
    },
}));
jest.mock("@/config/aws", () => ({
    downloadStoredFile: jest.fn(),
    uploadFileToS3: jest.fn(),
    generatePresignedUrl: jest
        .fn()
        .mockResolvedValue("https://signed.example/pdf"),
}));
jest.mock("@/services/documentPdf", () => ({ generateDocumentPdf: jest.fn() }));

const bytes = Buffer.from("%PDF-approved-content");
const document = fromSegments([
    { type: "input", key: "contract.vorname", label: "Vorname" },
]);
const scope = {
    organizationId: "org-1",
    engagementId: "eng-1",
    kind: "employment_contract" as const,
};
const artifact = () => ({
    ...scope,
    id: "pdf-1",
    masterId: "master-1",
    masterRevision: 1,
    name: "Vertrag",
    recipient: "ada@example.de",
    status: "prepared",
    s3Key: "private/pdf-1",
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    snapshot: document,
    values: { "contract.vorname": "Ada" },
});
const deliver = jest.fn();
const finalize = jest.fn();
const params = () => ({
    ...scope,
    artifactId: "pdf-1",
    actorUserId: "user-1",
    recipient: "ada@example.de",
    deliver,
    finalize,
});
beforeEach(() => {
    jest.resetAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma),
    );
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        id: "master-1",
        revision: 1,
        approvedAt: new Date(),
        body: document,
        name: "Vertrag",
    });
    (prisma.preparedDocument.findFirst as jest.Mock).mockImplementation(
        (query) => (query.where.id === "pdf-1" ? artifact() : null),
    );
    (prisma.preparedDocument.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
    });
    (downloadStoredFile as jest.Mock).mockResolvedValue(bytes);
    deliver.mockResolvedValue("provider-1");
    (prisma.employmentContract.findUnique as jest.Mock).mockResolvedValue({
        masterId: "master-1",
        status: "draft",
        sentAt: null,
        values: [{ key: "contract.vorname", value: "Ada" }],
    });
});
describe("approved PDF delivery", () => {
    it("prepares a scoped snapshot and supersedes previous safe preparations", async () => {
        (generateDocumentPdf as jest.Mock).mockResolvedValue({
            bytes,
            hash: artifact().contentHash,
            fonts: [{ filename: "Calibri.ttf", hash: "font-hash" }],
            fontAssets: [
                {
                    filename: "Calibri.ttf",
                    hash: "font-hash",
                    bytes: Buffer.from("font-snapshot"),
                },
            ],
        });
        (uploadFileToS3 as jest.Mock).mockResolvedValue({
            success: true,
            key: "stored",
        });
        (prisma.preparedDocument.create as jest.Mock).mockResolvedValue({
            ...artifact(),
            s3Key: "stored",
        });
        const result = await prepareDocument({
            ...scope,
            masterId: "master-1",
            recipient: "ada@example.de",
            values: artifact().values,
        });
        expect(result.id).toBe("pdf-1");
        expect(prisma.preparedDocument.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                ...scope,
                snapshot: document,
                values: artifact().values,
                contentHash: artifact().contentHash,
                masterRevision: 1,
                fontManifest: [
                    {
                        filename: "Calibri.ttf",
                        hash: "font-hash",
                        s3Key: "stored",
                    },
                ],
            }),
        });
        expect(prisma.preparedDocument.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ data: { status: "superseded" } }),
        );
    });
    it("checks saved certificate values and the selected master before sending", async () => {
        const letterScope = { ...scope, kind: "arbeitszeugnis" as const };
        (prisma.preparedDocument.findFirst as jest.Mock).mockImplementation(
            (query) =>
                query.where.id === "pdf-1"
                    ? { ...artifact(), ...letterScope }
                    : null,
        );
        (prisma.arbeitszeugnis.findUnique as jest.Mock).mockResolvedValue({
            masterId: "master-1",
            draftValues: artifact().values,
        });
        (
            prisma.automationDocumentSetting.findUnique as jest.Mock
        ).mockResolvedValue({ documentMasterId: "master-1" });
        await sendPreparedDocument({ ...params(), ...letterScope });
        expect(deliver).toHaveBeenCalledTimes(1);
        (
            prisma.automationDocumentSetting.findUnique as jest.Mock
        ).mockResolvedValue({ documentMasterId: "new-master" });
        await expect(
            sendPreparedDocument({ ...params(), ...letterScope }),
        ).rejects.toThrow("Zeugnisentwurf");
        expect(deliver).toHaveBeenCalledTimes(1);
    });
    it("rejects a draft changed while PDF generation was in flight or before sending", async () => {
        (prisma.employmentContract.findUnique as jest.Mock).mockResolvedValue({
            masterId: "master-1",
            status: "draft",
            values: [{ key: "contract.vorname", value: "Grace" }],
        });
        await expect(sendPreparedDocument(params())).rejects.toThrow(
            "Werte wurden geändert",
        );
        expect(deliver).not.toHaveBeenCalled();
        (generateDocumentPdf as jest.Mock).mockResolvedValue({
            bytes,
            hash: artifact().contentHash,
            fonts: [],
        });
        (uploadFileToS3 as jest.Mock).mockResolvedValue({
            success: true,
            key: "stored",
        });
        await expect(
            prepareDocument({
                ...scope,
                masterId: "master-1",
                recipient: "ada@example.de",
                values: artifact().values,
            }),
        ).rejects.toThrow("Werte wurden geändert");
        expect(prisma.preparedDocument.create).not.toHaveBeenCalled();
    });
    it("sends the exact stored bytes and snapshots values only after acceptance", async () => {
        await sendPreparedDocument(params());
        expect(deliver).toHaveBeenCalledWith(
            {
                filename: "Vertrag.pdf",
                content: bytes,
                contentType: "application/pdf",
            },
            "pdf-1",
        );
        expect(finalize).toHaveBeenCalledWith(
            prisma,
            document,
            { "contract.vorname": "Ada" },
            "pdf-1",
            "provider-1",
        );
        expect(prisma.preparedDocument.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: "sent",
                    providerId: "provider-1",
                }),
            }),
        );
    });
    it("rejects another organization's artifact", async () => {
        (prisma.preparedDocument.findFirst as jest.Mock).mockResolvedValue(
            null,
        );
        await expect(
            sendPreparedDocument({ ...params(), organizationId: "org-2" }),
        ).rejects.toThrow("nicht gefunden");
        expect(prisma.preparedDocument.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ organizationId: "org-2" }),
            }),
        );
        expect(deliver).not.toHaveBeenCalled();
    });
    it("rejects changed PDF bytes and stale master revisions", async () => {
        (downloadStoredFile as jest.Mock).mockResolvedValue(
            Buffer.from("%PDF-different"),
        );
        await expect(sendPreparedDocument(params())).rejects.toThrow(
            "Prüfsumme",
        );
        (downloadStoredFile as jest.Mock).mockResolvedValue(bytes);
        (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue(null);
        await expect(sendPreparedDocument(params())).rejects.toThrow(
            "Vorlage wurde geändert",
        );
        expect(deliver).not.toHaveBeenCalled();
    });
    it("prevents concurrent sends and never retries uncertain deliveries automatically", async () => {
        (prisma.preparedDocument.updateMany as jest.Mock).mockResolvedValue({
            count: 0,
        });
        await expect(sendPreparedDocument(params())).rejects.toThrow(
            "anderer Benutzer",
        );
        expect(deliver).not.toHaveBeenCalled();
        (prisma.preparedDocument.findFirst as jest.Mock).mockResolvedValue({
            ...artifact(),
            status: "uncertain",
        });
        await expect(sendPreparedDocument(params())).rejects.toThrow(
            "Versandstatus",
        );
        expect(deliver).not.toHaveBeenCalled();
    });
    it("retains a safe retry after rejection but records unknown outcomes after a timeout", async () => {
        deliver.mockRejectedValue(new DeliveryRejected("rejected"));
        await expect(sendPreparedDocument(params())).rejects.toThrow("erneut");
        expect(prisma.preparedDocument.update).toHaveBeenCalledWith({
            where: { id: "pdf-1" },
            data: { status: "failed" },
        });
        deliver.mockRejectedValue(new Error("timeout"));
        await expect(sendPreparedDocument(params())).rejects.toThrow("unklar");
        expect(prisma.preparedDocument.update).toHaveBeenCalledWith({
            where: { id: "pdf-1" },
            data: { status: "uncertain" },
        });
        expect(finalize).not.toHaveBeenCalled();
    });
    it("does not create artifacts when rendering or storage fails", async () => {
        const input = {
            ...scope,
            masterId: "master-1",
            values: { "contract.vorname": "Ada" },
            recipient: "ada@example.de",
        };
        (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
            id: "master-1",
            revision: 1,
            approvedAt: new Date(),
            body: document,
        });
        (generateDocumentPdf as jest.Mock).mockRejectedValue(
            new Error("font missing"),
        );
        await expect(prepareDocument(input)).rejects.toThrow("font missing");
        expect(uploadFileToS3).not.toHaveBeenCalled();
        (generateDocumentPdf as jest.Mock).mockResolvedValue({
            bytes,
            hash: artifact().contentHash,
            fonts: [],
        });
        (uploadFileToS3 as jest.Mock).mockResolvedValue({ success: false });
        await expect(prepareDocument(input)).rejects.toThrow("gespeichert");
        expect(prisma.preparedDocument.create).not.toHaveBeenCalled();
    });
});
