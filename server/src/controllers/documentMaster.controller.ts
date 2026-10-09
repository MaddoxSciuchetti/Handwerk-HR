import { BAD_REQUEST, CREATED, OK } from "@/constants/http";
import {
    createDocumentMaster,
    getDocumentMaster,
    listDocumentMasters,
    updateDocumentMaster,
} from "@/services/documentMaster.service";
import {
    parseDocumentSegments,
    segmentsFromText,
} from "@/services/documentBody";
import { importStyledDocument } from "@/services/importStyledDocument";
import { parseStyledDocument } from "@/services/styledDocument";
import { fontStatus, fontBytes } from "@/services/documentFonts";
import { uploadFileToS3 } from "@/config/aws";
import AppError from "@/utils/AppError";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

const NAME_MAX = 200;

function param(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

function nameFromFile(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, "").trim();
    return (base || "Dokument").slice(0, NAME_MAX);
}

function requireName(name: string): string {
    const trimmed = name.trim();
    appAssert(trimmed.length > 0, BAD_REQUEST, "Name ist erforderlich.");
    appAssert(trimmed.length <= NAME_MAX, BAD_REQUEST, "Name ist zu lang.");
    return trimmed;
}

export const listMasters = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const masters = await listDocumentMasters(req.orgId);
    return res.status(OK).json(masters);
});

export const createMaster = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const file = req.file;
    if (!file) {
        throw new AppError(BAD_REQUEST, "Bitte eine Datei auswählen.");
    }

    const body = req.body as { kind?: string; name?: string };
    appAssert(body.kind, BAD_REQUEST, "Dokumentart fehlt.");

    const imported = await importStyledDocument(file);
    const document = parseStyledDocument({
        ...imported.document,
        importWarnings: imported.warnings
            .slice(0, 100)
            .map((warning) => warning.slice(0, 500)),
    });
    const stored = await uploadFileToS3(file, req.orgId, "documents/originals");
    appAssert(
        stored.success && stored.key,
        BAD_REQUEST,
        "Original konnte nicht gespeichert werden.",
    );

    const name = requireName(
        typeof body.name === "string" && body.name.trim().length > 0
            ? body.name
            : nameFromFile(file.originalname),
    );

    const master = await createDocumentMaster({
        organizationId: req.orgId,
        kind: body.kind,
        name,
        document,
        sourceKey: stored.key,
        sourceName: file.originalname,
        sourceMime: file.mimetype,
    });

    return res
        .status(CREATED)
        .json({ ...master, importWarnings: imported.warnings });
});

export const getMaster = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const master = await getDocumentMaster(param(req.params.id), req.orgId);
    return res.status(OK).json(master);
});

export const updateMaster = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const body = req.body as {
        name?: string;
        text?: string;
        segments?: unknown;
        document?: unknown;
        revision?: number;
        approved?: boolean;
    };
    const document = body.document
        ? parseStyledDocument(body.document)
        : undefined;
    const segments = Array.isArray(body.segments)
        ? parseDocumentSegments(body.segments)
        : typeof body.text === "string"
          ? parseDocumentSegments(segmentsFromText(body.text))
          : null;
    appAssert(document || segments, BAD_REQUEST, "Text fehlt.");

    const master = await updateDocumentMaster({
        id: param(req.params.id),
        organizationId: req.orgId,
        name: requireName(body.name ?? ""),
        segments: segments ?? undefined,
        document,
        revision: body.revision,
        approved: body.approved === true,
    });

    return res.status(OK).json(master);
});

export const getDocumentFontStatus = catchErrors(async (_req, res) => {
    res.json(await fontStatus());
});
export const getDocumentFont = catchErrors(async (req, res) => {
    const bytes = await fontBytes(String(req.params.filename));
    res.setHeader("Content-Type", "font/ttf");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(bytes);
});
