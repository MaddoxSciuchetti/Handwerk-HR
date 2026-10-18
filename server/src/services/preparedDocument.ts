import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
    uploadFileToS3,
    downloadStoredFile,
    generatePresignedUrl,
} from "@/config/aws";
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import AppError from "@/utils/AppError";
import { generateDocumentPdf } from "@/services/documentPdf";
import { parseStyledDocument } from "@/services/styledDocument";
import { validateFieldValues } from "../../../shared/documentRendering";
import { documentFields, resolveCurrentDateValues, type StyledDocument } from "../../../shared/document";
import { Prisma } from "@prisma/client";

export type PreparedScope = {
    organizationId: string;
    engagementId: string;
    kind: "employment_contract" | "arbeitszeugnis";
};
import {
    DeliveryRejected,
    type PdfAttachment,
} from "@/services/documentDelivery";
export {
    DeliveryRejected,
    type PdfAttachment,
} from "@/services/documentDelivery";
const scopeWhere = (scope: PreparedScope) => ({
    organizationId: scope.organizationId,
    engagementId: scope.engagementId,
    kind: scope.kind,
});

export async function outgoingPdfUrl(
    scope: PreparedScope,
    artifactId: string | null,
) {
    if (!artifactId) return null;
    const artifact = await prisma.preparedDocument.findFirst({
        where: { ...scopeWhere(scope), id: artifactId, status: "sent" },
        select: { s3Key: true },
    });
    return artifact ? generatePresignedUrl(artifact.s3Key) : null;
}

export async function currentPreparation(scope: PreparedScope) {
    const artifact = await prisma.preparedDocument.findFirst({
        where: {
            ...scopeWhere(scope),
            status: { in: ["prepared", "failed", "sending", "uncertain"] },
        },
        orderBy: { createdAt: "desc" },
    });
    if (!artifact) return null;
    if (["prepared", "failed"].includes(artifact.status)) {
        const master = await prisma.documentMaster.findFirst({
            where: {
                id: artifact.masterId,
                organizationId: scope.organizationId,
                revision: artifact.masterRevision,
                deletedAt: null,
            },
        });
        if (!master) return null;
        // Reusing the template on a later day requires a freshly generated PDF.
        // Already sent PDFs keep their immutable artifact and recorded values.
        if (artifact.snapshot && artifact.values) {
            const saved = artifact.values as Record<string, string>;
            const current = resolveCurrentDateValues(artifact.snapshot as unknown as StyledDocument, saved);
            if (Object.entries(current).some(([key, value]) => saved[key] !== value))
                return null;
        }
    }
    return {
        id: artifact.id,
        previewUrl: await generatePresignedUrl(artifact.s3Key),
        contentHash: artifact.contentHash,
        masterRevision: artifact.masterRevision,
        status: artifact.status,
    };
}

async function assertCurrentDraft(
    tx: Prisma.TransactionClient,
    scope: PreparedScope,
    masterId: string,
    document: StyledDocument,
    values: Record<string, string>,
) {
    let saved: Record<string, string>;
    if (scope.kind === "employment_contract") {
        const contract = await tx.employmentContract.findUnique({
            where: { engagementId: scope.engagementId },
            include: { values: true },
        });
        if (
            !contract ||
            contract.masterId !== masterId ||
            contract.sentAt ||
            contract.status === "signed"
        )
            throw new AppError(
                CONFLICT,
                "Der Vertragsentwurf hat sich geändert.",
            );
        saved = Object.fromEntries(
            contract.values.map((entry) => [entry.key, entry.value]),
        );
    } else {
        const letter = await tx.arbeitszeugnis.findUnique({
            where: { engagementId: scope.engagementId },
        });
        const setting = await tx.automationDocumentSetting.findUnique({
            where: {
                organizationId_automation: {
                    organizationId: scope.organizationId,
                    automation: "arbeitszeugnis",
                },
            },
        });
        if (
            !letter ||
            letter.masterId !== masterId ||
            setting?.documentMasterId !== masterId ||
            letter.sentAt
        )
            throw new AppError(
                CONFLICT,
                "Der Zeugnisentwurf hat sich geändert.",
            );
        saved = (letter.draftValues ?? {}) as Record<string, string>;
    }
    const keys = new Set(documentFields(document).map((field) => field.key));
    const normalized = validateFieldValues(
        document,
        Object.fromEntries(
            Object.entries(saved).filter(([key]) => keys.has(key)),
        ),
    );
    if (
        Object.keys(values).length !== Object.keys(normalized).length ||
        Object.entries(values).some(([key, value]) => normalized[key] !== value)
    ) {
        throw new AppError(
            CONFLICT,
            "Die Werte wurden geändert. Bitte das PDF erneut erstellen.",
        );
    }
}

export async function prepareDocument(
    params: PreparedScope & {
        masterId: string;
        values: Record<string, unknown>;
        recipient: string;
    },
) {
    const master = await prisma.documentMaster.findFirst({
        where: {
            id: params.masterId,
            organizationId: params.organizationId,
            kind: params.kind,
            deletedAt: null,
        },
    });
    if (!master) throw new AppError(NOT_FOUND, "Vorlage nicht gefunden.");
    const document = parseStyledDocument(master.body);
    let values: Record<string, string>;
    try {
        values = validateFieldValues(document, params.values);
    } catch (error) {
        throw new AppError(BAD_REQUEST, (error as Error).message);
    }
    let pdf: Awaited<ReturnType<typeof generateDocumentPdf>>;
    try {
        pdf = await generateDocumentPdf(document, values);
    } catch (error) {
        console.info("Document PDF preparation failed", {
            kind: params.kind,
            outcome: "generation_failed",
        });
        throw error;
    }
    const stored = await uploadFileToS3(
        {
            buffer: pdf.bytes,
            mimetype: "application/pdf",
        } as Express.Multer.File,
        params.engagementId,
        "documents/prepared",
    );
    if (!stored.success || !stored.key)
        throw new AppError(BAD_REQUEST, "PDF konnte nicht gespeichert werden.");
    const fontManifest = await Promise.all(
        (pdf.fontAssets ?? []).map(async (font) => {
            const asset = await uploadFileToS3(
                {
                    buffer: font.bytes,
                    mimetype: "font/ttf",
                } as Express.Multer.File,
                params.engagementId,
                "documents/font-snapshots",
            );
            if (!asset.success || !asset.key)
                throw new AppError(
                    BAD_REQUEST,
                    "Schrift-Snapshot konnte nicht gespeichert werden.",
                );
            return {
                filename: font.filename,
                hash: font.hash,
                s3Key: asset.key,
            };
        }),
    );
    const artifact = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM worker_engagements WHERE id = ${params.engagementId} FOR UPDATE`;
        const latest = await tx.documentMaster.findFirst({
            where: {
                id: master.id,
                revision: master.revision,
                deletedAt: null,
            },
        });
        if (!latest)
            throw new AppError(
                CONFLICT,
                "Die Vorlage wurde geändert. Bitte das PDF erneut erstellen.",
            );
        await assertCurrentDraft(tx, params, master.id, document, values);
        const active = await tx.preparedDocument.findFirst({
            where: {
                organizationId: params.organizationId,
                engagementId: params.engagementId,
                kind: params.kind,
                status: { in: ["sending", "sent", "uncertain"] },
            },
        });
        if (active)
            throw new AppError(
                CONFLICT,
                "Versand ist bereits erfolgt oder muss geprüft werden.",
            );
        await tx.preparedDocument.updateMany({
            where: {
                organizationId: params.organizationId,
                engagementId: params.engagementId,
                kind: params.kind,
                status: { in: ["prepared", "failed"] },
            },
            data: { status: "superseded" },
        });
        return tx.preparedDocument.create({
            data: {
                organizationId: params.organizationId,
                engagementId: params.engagementId,
                kind: params.kind,
                masterId: master.id,
                masterRevision: master.revision,
                name: master.name,
                recipient: params.recipient,
                snapshot: document as unknown as Prisma.InputJsonValue,
                values,
                fontManifest: fontManifest.length ? fontManifest : pdf.fonts,
                s3Key: stored.key!,
                contentHash: pdf.hash,
            },
        });
    });
    console.info("Document PDF prepared", {
        artifactId: artifact.id,
        kind: params.kind,
        contentHash: artifact.contentHash,
    });
    return {
        id: artifact.id,
        previewUrl: await generatePresignedUrl(artifact.s3Key),
        contentHash: artifact.contentHash,
        masterRevision: artifact.masterRevision,
    };
}

export async function invalidatePreparedDocuments(
    scope: PreparedScope,
    transaction?: Prisma.TransactionClient,
) {
    const invalidate = async (tx: Prisma.TransactionClient) => {
        await tx.$queryRaw`SELECT id FROM worker_engagements WHERE id = ${scope.engagementId} FOR UPDATE`;
        const active = await tx.preparedDocument.findFirst({
            where: {
                ...scopeWhere(scope),
                status: { in: ["sending", "uncertain"] },
            },
        });
        if (active)
            throw new AppError(
                CONFLICT,
                "Versand läuft oder muss geprüft werden.",
            );
        await tx.preparedDocument.updateMany({
            where: {
                ...scopeWhere(scope),
                status: { in: ["prepared", "failed"] },
            },
            data: { status: "superseded" },
        });
    };
    if (transaction) await invalidate(transaction);
    else await prisma.$transaction(invalidate);
}

export async function sendPreparedDocument(
    params: PreparedScope & {
        artifactId: string;
        actorUserId: string;
        recipient: string;
        deliver: (
            attachment: PdfAttachment,
            artifactId: string,
        ) => Promise<string>;
        finalize: (
            tx: Prisma.TransactionClient,
            document: StyledDocument,
            values: Record<string, string>,
            artifactId: string,
            providerId: string,
        ) => Promise<void>;
    },
) {
    const artifact = await prisma.preparedDocument.findFirst({
        where: {
            id: params.artifactId,
            organizationId: params.organizationId,
            engagementId: params.engagementId,
            kind: params.kind,
        },
    });
    if (!artifact)
        throw new AppError(NOT_FOUND, "Vorbereitetes PDF nicht gefunden.");
    if (artifact.status === "sent") return;
    if (!["prepared", "failed"].includes(artifact.status))
        throw new AppError(
            CONFLICT,
            "Dieses PDF kann nicht versendet werden. Versandstatus bitte prüfen.",
        );
    if (artifact.recipient !== params.recipient)
        throw new AppError(
            CONFLICT,
            "Die Empfängeradresse hat sich geändert. Bitte das PDF erneut erstellen.",
        );
    const bytes = await downloadStoredFile(artifact.s3Key);
    if (
        createHash("sha256").update(bytes).digest("hex") !==
        artifact.contentHash
    )
        throw new AppError(CONFLICT, "Die PDF-Prüfsumme stimmt nicht überein.");
    await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM worker_engagements WHERE id = ${params.engagementId} FOR UPDATE`;
        const master = await tx.documentMaster.findFirst({
            where: {
                id: artifact.masterId,
                organizationId: params.organizationId,
                revision: artifact.masterRevision,
                deletedAt: null,
            },
        });
        if (!master)
            throw new AppError(
                CONFLICT,
                "Die Vorlage wurde geändert. Bitte das PDF erneut erstellen.",
            );
        await assertCurrentDraft(
            tx,
            params,
            artifact.masterId,
            artifact.snapshot as unknown as StyledDocument,
            artifact.values as Record<string, string>,
        );
        const other = await tx.preparedDocument.findFirst({
            where: {
                organizationId: params.organizationId,
                engagementId: params.engagementId,
                kind: params.kind,
                id: { not: artifact.id },
                status: { in: ["sending", "sent", "uncertain"] },
            },
        });
        if (other)
            throw new AppError(
                CONFLICT,
                "Ein Versand für dieses Dokument ist bereits aktiv.",
            );
        const claimed = await tx.preparedDocument.updateMany({
            where: { id: artifact.id, status: { in: ["prepared", "failed"] } },
            data: {
                status: "sending",
                approvedBy: params.actorUserId,
                approvedAt: new Date(),
            },
        });
        if (!claimed.count)
            throw new AppError(
                CONFLICT,
                "Ein anderer Benutzer hat den Versand bereits gestartet.",
            );
    });
    let providerId: string;
    try {
        providerId = await params.deliver(
            {
                filename:
                    artifact.name.replace(/[\\/:*?"<>|\r\n]/g, "_") + ".pdf",
                content: bytes,
                contentType: "application/pdf",
            },
            artifact.id,
        );
    } catch (error) {
        const definitive = error instanceof DeliveryRejected;
        await prisma.preparedDocument.update({
            where: { id: artifact.id },
            data: { status: definitive ? "failed" : "uncertain" },
        });
        console.info("Document PDF delivery failed", {
            artifactId: artifact.id,
            kind: artifact.kind,
            outcome: definitive ? "rejected" : "uncertain",
        });
        throw new AppError(
            BAD_REQUEST,
            definitive
                ? "Versand abgelehnt. Das geprüfte PDF kann erneut versendet werden."
                : "Versandstatus unklar. Bitte im Postausgang prüfen, bevor erneut versendet wird.",
        );
    }
    // If this transaction fails after provider acceptance, the artifact remains 'sending'.
    // Never automatically resend it: reconcile against the provider's sent-mail record.
    await prisma.$transaction(async (tx) => {
        await params.finalize(
            tx,
            artifact.snapshot as unknown as StyledDocument,
            artifact.values as Record<string, string>,
            artifact.id,
            providerId,
        );
        await tx.preparedDocument.update({
            where: { id: artifact.id },
            data: { status: "sent", sentAt: new Date(), providerId },
        });
    });
    console.info("Document PDF sent", {
        artifactId: artifact.id,
        kind: artifact.kind,
        contentHash: artifact.contentHash,
    });
}
