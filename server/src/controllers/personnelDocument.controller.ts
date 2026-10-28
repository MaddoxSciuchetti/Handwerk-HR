import * as personnelDocumentService from "@/services/personnelDocument.service";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";

function param(req: Request, key: string): string {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : String(val);
}

export const listPersonnelDocuments = catchErrors(
    async (req: Request, res: Response) => {
        const { documents, folders, hiddenFolders } =
            await personnelDocumentService.listPersonnelDocuments({
                organizationId: req.orgId,
                workerId: param(req, "workerId"),
            });
        return res
            .status(200)
            .json({ success: true, data: documents, folders, hiddenFolders });
    },
);

export const createPersonnelFolder = catchErrors(
    async (req: Request, res: Response) => {
        const label = typeof req.body?.label === "string" ? req.body.label : "";
        const data = await personnelDocumentService.createPersonnelFolder({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
            label,
        });
        return res.status(201).json({ success: true, data });
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
        const folderId =
            typeof req.body?.folderId === "string" ? req.body.folderId : "";
        const data = await personnelDocumentService.uploadPersonnelDocument({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
            uploadedByUserId: req.userId,
            name,
            folderId,
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

export const movePersonnelDocument = catchErrors(
    async (req: Request, res: Response) => {
        await personnelDocumentService.movePersonnelDocument({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            documentId: param(req, "documentId"),
            engagementId:
                typeof req.body?.engagementId === "string"
                    ? req.body.engagementId
                    : "",
            name: typeof req.body?.name === "string" ? req.body.name : "",
            folderId:
                typeof req.body?.folderId === "string"
                    ? req.body.folderId
                    : undefined,
            source:
                typeof req.body?.source === "string"
                    ? req.body.source
                    : undefined,
        });
        return res.status(200).json({ success: true });
    },
);

export const deletePersonnelFolder = catchErrors(
    async (req: Request, res: Response) => {
        await personnelDocumentService.deletePersonnelFolder({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            folderId: param(req, "folderId"),
            confirmed: req.query.confirmed === "true",
        });
        return res.status(200).json({ success: true });
    },
);
