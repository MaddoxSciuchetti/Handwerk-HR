import { prisma } from "@/lib/prisma";
import {
    createEngagementTemplateDocument,
    printEngagementTemplateDocument,
    syncEngagementTemplateDocument,
} from "@/services/engagementTemplateDocument.service";
import { generateDocumentPdf } from "@/services/documentPdf";
import { fromSegments } from "../../shared/document";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        workerEngagement: { findFirst: jest.fn() },
        documentMaster: { findFirst: jest.fn() },
        engagementTemplateDocument: {
            findFirst: jest.fn(),
            findFirstOrThrow: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        engagementTemplateDocumentValue: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));
jest.mock("@/services/documentPdf", () => ({
    generateDocumentPdf: jest.fn(),
}));

const params = {
    organizationId: "org",
    workerId: "worker",
    engagementId: "eng",
};
const body = fromSegments([
    { type: "input", key: "worker.vorname", label: "Vorname" },
]);
const pointsBody = fromSegments([
    { type: "input", key: "worker.vorname", label: "Vorname" },
    { type: "input", key: "worker.aufgaben", label: "Aufgaben", fieldType: "points" },
]);

function stored(overrides: Record<string, unknown> = {}) {
    return {
        id: "doc",
        engagementId: "eng",
        masterId: "master",
        matchedMasterRevision: null,
        master: {
            id: "master",
            name: "KFZ-Bescheinigung",
            kind: "kfz_ueberlassungsvertrag",
            body,
            revision: 3,
        },
        values: [] as { key: string; value: string }[],
        engagement: {
            questionnaireSubmission: {
                status: "completed",
                formDefinition: null,
                answers: [{ key: "firstName", value: "Ada" }],
            },
            worker: { email: "ada@example.com" },
        },
        ...overrides,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(prisma));
    (prisma.workerEngagement.findFirst as jest.Mock).mockResolvedValue({ id: "eng" });
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        id: "master",
        kind: "kfz_ueberlassungsvertrag",
    });
    (prisma.engagementTemplateDocument.findUnique as jest.Mock).mockResolvedValue({
        masterId: "master",
    });
    (prisma.engagementTemplateDocument.update as jest.Mock).mockResolvedValue({});
    (prisma.engagementTemplateDocumentValue.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
    });
    (prisma.engagementTemplateDocumentValue.createMany as jest.Mock).mockResolvedValue({
        count: 1,
    });
    (generateDocumentPdf as jest.Mock).mockResolvedValue({
        bytes: Buffer.from("%PDF-1.4"),
    });
});

it("creates a document from a template and reopens the same one", async () => {
    (prisma.engagementTemplateDocument.findFirst as jest.Mock).mockResolvedValueOnce(null);
    (prisma.engagementTemplateDocument.create as jest.Mock).mockResolvedValue(stored());

    const created = await createEngagementTemplateDocument({
        ...params,
        masterId: "master",
    });

    expect(created.created).toBe(true);
    expect(created.document.name).toBe("KFZ-Bescheinigung");
    expect(created.document.values).toEqual({});
    expect(prisma.engagementTemplateDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
            data: { engagementId: "eng", masterId: "master" },
        }),
    );

    (prisma.engagementTemplateDocument.findFirst as jest.Mock).mockResolvedValue(stored());
    const again = await createEngagementTemplateDocument({
        ...params,
        masterId: "master",
    });
    expect(again.created).toBe(false);
    expect(again.document.id).toBe("doc");
    expect(prisma.engagementTemplateDocument.create).toHaveBeenCalledTimes(1);
});

it("rejects the employment contract as an engagement template", async () => {
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        id: "master",
        kind: "employment_contract",
    });

    await expect(
        createEngagementTemplateDocument({ ...params, masterId: "master" }),
    ).rejects.toThrow("Arbeitsvertrag");
    expect(prisma.engagementTemplateDocument.create).not.toHaveBeenCalled();
});

it("fills template fields from the completed questionnaire and keeps description points", async () => {
    const current = stored({
        master: { ...stored().master, body: pointsBody },
        values: [{ key: "worker.aufgaben", value: "Montage" }],
    });
    (prisma.engagementTemplateDocument.findFirst as jest.Mock).mockResolvedValue(current);
    (prisma.engagementTemplateDocument.findFirstOrThrow as jest.Mock).mockImplementation(
        async () =>
            stored({
                master: { ...stored().master, body: pointsBody },
                matchedMasterRevision: 3,
                values: [
                    { key: "worker.vorname", value: "Ada" },
                    { key: "worker.aufgaben", value: "Montage" },
                ],
            }),
    );

    const saved = await syncEngagementTemplateDocument({
        ...params,
        documentId: "doc",
    });

    expect(saved.values).toEqual({
        "worker.vorname": "Ada",
        "worker.aufgaben": "Montage",
    });
    expect(prisma.engagementTemplateDocumentValue.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
            expect.objectContaining({ key: "worker.vorname", value: "Ada" }),
            expect.objectContaining({ key: "worker.aufgaben", value: "Montage" }),
        ]),
    });
    expect(prisma.engagementTemplateDocument.update).toHaveBeenCalledWith({
        where: { id: "doc" },
        data: { matchedMasterRevision: 3 },
    });
});

it("refuses to sync before the questionnaire is completed", async () => {
    (prisma.engagementTemplateDocument.findFirst as jest.Mock).mockResolvedValue(
        stored({
            engagement: {
                questionnaireSubmission: { status: "sent", formDefinition: null, answers: [] },
                worker: { email: "" },
            },
        }),
    );

    await expect(
        syncEngagementTemplateDocument({ ...params, documentId: "doc" }),
    ).rejects.toThrow("Der Fragebogen ist noch nicht ausgefüllt.");
    expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("prints the saved template values without the employment contract", async () => {
    (prisma.engagementTemplateDocument.findFirst as jest.Mock).mockResolvedValue(stored());
    (prisma.engagementTemplateDocument.findFirstOrThrow as jest.Mock).mockResolvedValue(
        stored({ values: [{ key: "worker.vorname", value: "Ada" }] }),
    );

    const pdf = await printEngagementTemplateDocument({
        ...params,
        documentId: "doc",
        values: { "worker.vorname": "Ada" },
    });

    expect(pdf.bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.filename).toBe("KFZ-Bescheinigung.pdf");
    expect(generateDocumentPdf).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ "worker.vorname": "Ada" }),
    );
    expect(prisma).not.toHaveProperty("employmentContract");
});

it("prints directly from saved values without writing the document again", async () => {
    (prisma.engagementTemplateDocument.findFirst as jest.Mock).mockResolvedValue(
        stored({ values: [{ key: "worker.vorname", value: "Ada" }] }),
    );
    await printEngagementTemplateDocument({ ...params, documentId: "doc" });
    expect(generateDocumentPdf).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ "worker.vorname": "Ada" }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.engagementTemplateDocument.update).not.toHaveBeenCalled();
    expect(prisma.engagementTemplateDocumentValue.deleteMany).not.toHaveBeenCalled();
    expect(prisma.engagementTemplateDocumentValue.createMany).not.toHaveBeenCalled();
});
