import * as personnelDocumentService from "@/services/personnelDocument.service";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";

function param(req: Request, key: string): string {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : String(val);
}

export const listPersonnelDocuments = catchErrors(
    async (req: Request, res: Response) => {
        const data = await personnelDocumentService.listPersonnelDocuments({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
        });
        return res.status(200).json({ success: true, data });
    },
);

export const uploadPersonnelDocument = catchErrors(
    async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) {
            return res
                .status(400)
                .json({ success: false, message: "Datei fehlt." });
        }

        const name = typeof req.body?.name === "string" ? req.body.name : "";
        const data = await personnelDocumentService.uploadPersonnelDocument({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
            uploadedByUserId: req.userId,
            name,
            file,
        });
        return res.status(201).json({ success: true, data });
    },
);

export const renamePersonnelDocument = catchErrors(
    async (req: Request, res: Response) => {
        const name = typeof req.body?.name === "string" ? req.body.name : "";
        const data = await personnelDocumentService.renamePersonnelDocument({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            documentId: param(req, "documentId"),
            name,
        });
        return res.status(200).json({ success: true, data });
    },
);

export const deletePersonnelDocument = catchErrors(
    async (req: Request, res: Response) => {
        await personnelDocumentService.deletePersonnelDocument({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            documentId: param(req, "documentId"),
        });
        return res.status(200).json({ success: true });
    },
);
