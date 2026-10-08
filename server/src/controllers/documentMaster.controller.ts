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
import { extractDocumentText } from "@/services/extractDocumentText";
import AppError from "@/utils/AppError";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

const NAME_MAX = 200;
const TEXT_MAX = 200_000;

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
    appAssert(
        trimmed.length <= NAME_MAX,
        BAD_REQUEST,
        "Name ist zu lang.",
    );
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

    const text = await extractDocumentText(file);
    appAssert(
        text.length <= TEXT_MAX,
        BAD_REQUEST,
        "Das Dokument ist zu lang.",
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
        text,
    });

    return res.status(CREATED).json(master);
});

export const getMaster = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const master = await getDocumentMaster(param(req.params.id), req.orgId);
    return res.status(OK).json(master);
});

export const updateMaster = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const body = req.body as { name?: string; text?: string; segments?: unknown };
    const segments = Array.isArray(body.segments)
        ? parseDocumentSegments(body.segments)
        : typeof body.text === "string"
          ? parseDocumentSegments(segmentsFromText(body.text))
          : null;
    appAssert(segments, BAD_REQUEST, "Text fehlt.");

    const master = await updateDocumentMaster({
        id: param(req.params.id),
        organizationId: req.orgId,
        name: requireName(body.name ?? ""),
        segments,
    });

    return res.status(OK).json(master);
});
