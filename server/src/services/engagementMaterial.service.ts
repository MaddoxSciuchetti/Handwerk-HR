import { uploadFileToS3, generatePresignedUrl } from "@/config/aws";
import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";
import {
    parseMaterialLinesFromModel,
    type MaterialLine,
} from "@/services/engagementMaterialExtract";

const MODEL = "gpt-4o-mini";

const ALLOWED_MIME = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
]);

export type MaterialItemDto = {
    id: string;
    name: string;
    articleNumber: string;
    quantity: number;
    unitPrice: string;
    sourceDocumentId: string | null;
};

export type MaterialDocumentDto = {
    id: string;
    name: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    createdAt: Date;
    presignedUrl: string;
    materials: MaterialItemDto[];
};

type Scope = {
    organizationId: string;
    workerId: string;
    engagementId: string;
};

function openAiKey() {
    return process.env.OPENAI_API_KEY?.trim() ?? "";
}

function assertOpenAiConfigured() {
    if (!openAiKey()) {
        throw new AppError(
            BAD_REQUEST,
            "OPENAI_API_KEY fehlt. Materialien können nicht gelesen werden.",
        );
    }
}

function normalizeMime(mimeType: string): string {
    if (mimeType === "image/jpg") return "image/jpeg";
    return mimeType;
}

async function requireEngagement(scope: Scope) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: scope.engagementId,
            workerId: scope.workerId,
            organizationId: scope.organizationId,
        },
        select: { id: true },
    });
    if (!engagement) {
        throw new AppError(NOT_FOUND, "Engagement nicht gefunden.");
    }
    return engagement;
}

function toItem(material: {
    id: string;
    name: string;
    articleNumber: string;
    quantity: number;
    unitPrice: { toString(): string };
    sourceDocumentId: string | null;
}): MaterialItemDto {
    return {
        id: material.id,
        name: material.name,
        articleNumber: material.articleNumber,
        quantity: material.quantity,
        unitPrice: material.unitPrice.toString(),
        sourceDocumentId: material.sourceDocumentId,
    };
}

const extractionSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        items: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    name: { type: "string" },
                    articleNumber: { type: "string" },
                    quantity: { type: "number" },
                    unitPrice: { type: "number" },
                },
                required: ["name", "articleNumber", "quantity", "unitPrice"],
            },
        },
    },
    required: ["items"],
} as const;

async function extractLines(file: Express.Multer.File): Promise<MaterialLine[]> {
    assertOpenAiConfigured();
    const mimeType = normalizeMime(file.mimetype);
    const base64 = file.buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const filePart =
        mimeType === "application/pdf"
            ? {
                  type: "file",
                  file: {
                      filename: file.originalname || "beleg.pdf",
                      file_data: dataUrl,
                  },
              }
            : {
                  type: "image_url",
                  image_url: { url: dataUrl },
              };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${openAiKey()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: MODEL,
            temperature: 0,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "engagement_materials",
                    strict: true,
                    schema: extractionSchema,
                },
            },
            messages: [
                {
                    role: "system",
                    content:
                        "Du liest Belege über gekaufte Arbeitsmaterialien. Gib jede gekaufte Position zurück. Ignoriere Summen, Mehrwertsteuer, Versand und Rabatte. articleNumber ist leer, wenn keine Artikelnummer steht. unitPrice ist der Einzelpreis als Zahl mit Punkt als Dezimaltrenner (12.90). quantity ist eine ganze Zahl.",
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Lies die Positionen aus diesem Beleg.",
                        },
                        filePart,
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new AppError(
            BAD_REQUEST,
            "Der Beleg konnte nicht gelesen werden.",
        );
    }

    const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
        throw new AppError(
            BAD_REQUEST,
            "Der Beleg konnte nicht gelesen werden.",
        );
    }

    try {
        return parseMaterialLinesFromModel(content);
    } catch {
        throw new AppError(
            BAD_REQUEST,
            "Der Beleg konnte nicht gelesen werden.",
        );
    }
}

export async function listEngagementMaterials(scope: Scope) {
    await requireEngagement(scope);

    const documents = await prisma.engagementMaterialDocument.findMany({
        where: { engagementId: scope.engagementId },
        orderBy: { createdAt: "desc" },
        include: {
            materials: { orderBy: { createdAt: "asc" } },
        },
    });

    const unassigned = await prisma.engagementMaterial.findMany({
        where: {
            engagementId: scope.engagementId,
            sourceDocumentId: null,
        },
        orderBy: { createdAt: "asc" },
    });

    const documentDtos: MaterialDocumentDto[] = await Promise.all(
        documents.map(async (document) => ({
            id: document.id,
            name: document.name,
            mimeType: document.mimeType,
            fileSizeBytes: document.fileSizeBytes,
            createdAt: document.createdAt,
            presignedUrl: await generatePresignedUrl(document.fileUrl),
            materials: document.materials.map(toItem),
        })),
    );

    return {
        documents: documentDtos,
        unassigned: unassigned.map(toItem),
    };
}

export async function uploadEngagementMaterial(params: Scope & {
    file: Express.Multer.File;
}) {
    const mimeType = normalizeMime(params.file.mimetype || "");
    if (!ALLOWED_MIME.has(mimeType)) {
        throw new AppError(
            BAD_REQUEST,
            "Erlaubt sind Fotos (JPEG, PNG, WEBP, GIF) und PDF.",
        );
    }

    await requireEngagement(params);

    const upload = await uploadFileToS3(
        params.file,
        params.engagementId,
        "upload/engagement-materials",
    );
    if (!upload.success || !upload.key) {
        throw new AppError(BAD_REQUEST, "Upload fehlgeschlagen.");
    }

    const lines = await extractLines(params.file);

    const created = await prisma.$transaction(async (tx) => {
        const document = await tx.engagementMaterialDocument.create({
            data: {
                engagementId: params.engagementId,
                name: params.file.originalname || "Beleg",
                fileUrl: upload.key!,
                mimeType,
                fileSizeBytes: params.file.size,
            },
        });

        const materials = await Promise.all(
            lines.map((line) =>
                tx.engagementMaterial.create({
                    data: {
                        engagementId: params.engagementId,
                        sourceDocumentId: document.id,
                        name: line.name,
                        articleNumber: line.articleNumber,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                    },
                }),
            ),
        );

        return { document, materials };
    });

    return {
        document: {
            id: created.document.id,
            name: created.document.name,
            mimeType: created.document.mimeType,
            fileSizeBytes: created.document.fileSizeBytes,
            createdAt: created.document.createdAt,
            presignedUrl: await generatePresignedUrl(created.document.fileUrl),
            materials: created.materials.map(toItem),
        } satisfies MaterialDocumentDto,
    };
}

function parseMoneyInput(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        return Math.round(value * 100) / 100;
    }
    if (typeof value !== "string") {
        throw new AppError(BAD_REQUEST, "Preis ist ungültig.");
    }
    const raw = value.trim().replace(/€/g, "").replace(/\s/g, "");
    const normalized = raw.includes(",")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw;
    const parsed = Number(normalized);
    if (!raw || !Number.isFinite(parsed) || parsed < 0) {
        throw new AppError(BAD_REQUEST, "Preis ist ungültig.");
    }
    return Math.round(parsed * 100) / 100;
}

function parsePatch(body: {
    name?: unknown;
    articleNumber?: unknown;
    quantity?: unknown;
    unitPrice?: unknown;
}) {
    const data: {
        name?: string;
        articleNumber?: string;
        quantity?: number;
        unitPrice?: number;
    } = {};

    if (body.name !== undefined) {
        const name = String(body.name).trim().slice(0, 255);
        if (!name) {
            throw new AppError(BAD_REQUEST, "Name fehlt.");
        }
        data.name = name;
    }
    if (body.articleNumber !== undefined) {
        data.articleNumber = String(body.articleNumber).trim().slice(0, 120);
    }
    if (body.quantity !== undefined) {
        const quantity = Number(body.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new AppError(BAD_REQUEST, "Menge ist ungültig.");
        }
        data.quantity = quantity;
    }
    if (body.unitPrice !== undefined) {
        data.unitPrice = parseMoneyInput(body.unitPrice);
    }

    if (Object.keys(data).length === 0) {
        throw new AppError(BAD_REQUEST, "Keine Änderungen.");
    }
    return data;
}

export async function updateEngagementMaterial(
    scope: Scope & { materialId: string; body: Record<string, unknown> },
) {
    await requireEngagement(scope);
    const existing = await prisma.engagementMaterial.findFirst({
        where: { id: scope.materialId, engagementId: scope.engagementId },
    });
    if (!existing) {
        throw new AppError(NOT_FOUND, "Material nicht gefunden.");
    }

    const data = parsePatch(scope.body);
    const updated = await prisma.engagementMaterial.update({
        where: { id: existing.id },
        data,
    });
    return toItem(updated);
}

export async function deleteEngagementMaterial(
    scope: Scope & { materialId: string },
) {
    await requireEngagement(scope);
    const existing = await prisma.engagementMaterial.findFirst({
        where: { id: scope.materialId, engagementId: scope.engagementId },
        select: { id: true },
    });
    if (!existing) {
        throw new AppError(NOT_FOUND, "Material nicht gefunden.");
    }
    await prisma.engagementMaterial.delete({ where: { id: existing.id } });
}
