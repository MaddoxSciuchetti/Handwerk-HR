import * as templateDocuments from "@/services/engagementTemplateDocument.service";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";

function param(req: Request, key: string): string {
    const value = req.params[key];
    return Array.isArray(value) ? value[0] : String(value);
}

function scope(req: Request) {
    return {
        organizationId: req.orgId,
        workerId: param(req, "workerId"),
        engagementId: param(req, "engagementId"),
    };
}

function valuesFrom(body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    const values = (body as { values?: unknown }).values;
    if (!values || typeof values !== "object" || Array.isArray(values)) return null;
    return values as Record<string, unknown>;
}

export const listEngagementTemplateDocuments = catchErrors(
    async (req: Request, res: Response) => {
        const data = await templateDocuments.listEngagementTemplateDocuments(scope(req));
        return res.status(200).json({ success: true, data });
    },
);

export const createEngagementTemplateDocument = catchErrors(
    async (req: Request, res: Response) => {
        const masterId =
            typeof req.body?.masterId === "string" ? req.body.masterId.trim() : "";
        if (!masterId || masterId.length > 120) {
            return res.status(400).json({ success: false, message: "Vorlage fehlt." });
        }
        const result = await templateDocuments.createEngagementTemplateDocument({
            ...scope(req),
            masterId,
        });
        return res.status(result.created ? 201 : 200).json({
            success: true,
            data: result.document,
        });
    },
);

export const getEngagementTemplateDocument = catchErrors(
    async (req: Request, res: Response) => {
        const data = await templateDocuments.getEngagementTemplateDocument({
            ...scope(req),
            documentId: param(req, "documentId"),
        });
        return res.status(200).json({ success: true, data });
    },
);

export const saveEngagementTemplateDocument = catchErrors(
    async (req: Request, res: Response) => {
        const values = valuesFrom(req.body);
        if (!values) {
            return res.status(400).json({ success: false, message: "Werte fehlen." });
        }
        const data = await templateDocuments.saveEngagementTemplateDocument({
            ...scope(req),
            documentId: param(req, "documentId"),
            values,
        });
        return res.status(200).json({ success: true, data });
    },
);

export const syncEngagementTemplateDocument = catchErrors(
    async (req: Request, res: Response) => {
        const data = await templateDocuments.syncEngagementTemplateDocument({
            ...scope(req),
            documentId: param(req, "documentId"),
        });
        return res.status(200).json({ success: true, data });
    },
);

export const printEngagementTemplateDocument = catchErrors(
    async (req: Request, res: Response) => {
        const values = valuesFrom(req.body);
        const pdf = await templateDocuments.printEngagementTemplateDocument({
            ...scope(req),
            documentId: param(req, "documentId"),
            values: values ?? undefined,
        });
        const filename = pdf.filename.replace(/"/g, "");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
        res.setHeader("Cache-Control", "no-store");
        return res.send(pdf.bytes);
    },
);
