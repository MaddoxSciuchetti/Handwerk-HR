import { uploadFileToS3 } from "@/config/aws";
import { Request, Response } from "express";
import * as workerService from "../services/worker.service";

function param(req: Request, key: string): string {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : String(val);
}

export async function createWorker(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const createdByUserId = req.userId;
        const result = await workerService.createWorker({
            organizationId,
            createdByUserId,
            ...req.body,
        });
        return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        console.error("createWorker error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function getWorkerData(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const { status, search, page, limit, includeArchived } = req.query;

        const result = await workerService.getWorkerData({
            organizationId,
            status: status as any,
            search: search as string | undefined,
            page: page ? parseInt(page as string, 10) : 1,
            limit: limit ? parseInt(limit as string, 10) : 25,
            includeArchived: includeArchived === "true",
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("getWorkerData error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function getWorkerById(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const worker = await workerService.getWorkerById(
            workerId,
            organizationId,
        );
        if (!worker) {
            return res
                .status(404)
                .json({ success: false, message: "Worker not found" });
        }

        return res.status(200).json({ success: true, data: worker });
    } catch (error: any) {
        console.error("getWorkerById error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function updateWorker(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.updateWorker({
            organizationId,
            workerId,
            updateData: req.body,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("updateWorker error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function archiveWorker(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.archiveWorker({
            organizationId,
            workerId,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("archiveWorker error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function unarchiveWorker(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.unarchiveWorker({
            organizationId,
            workerId,
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("unarchiveWorker error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function deleteWorker(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        await workerService.deleteWorker({ organizationId, workerId });
        return res
            .status(200)
            .json({ success: true, message: "Worker deleted" });
    } catch (error: any) {
        console.error("deleteWorker error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function updateDataPoint(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const { field, value } = req.body;

        const result = await workerService.updateDataPoint({
            organizationId,
            workerId,
            field,
            value,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("updateDataPoint error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function createEngagement(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.createEngagement({
            organizationId,
            workerId,
            ...req.body,
        });

        return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        console.error("createEngagement error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function updateEngagement(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const engagementId = param(req, "engagementId");

        const result = await workerService.updateEngagement({
            organizationId,
            workerId,
            engagementId,
            ...req.body,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("updateEngagement error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function deleteEngagement(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const engagementId = param(req, "engagementId");

        await workerService.deleteEngagement({
            organizationId,
            workerId,
            engagementId,
        });
        return res
            .status(200)
            .json({ success: true, message: "Engagement deleted" });
    } catch (error: any) {
        console.error("deleteEngagement error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function createIssue(req: Request, res: Response) {
    try {
        const result = await workerService.createIssue(req.body);
        return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        console.error("createIssue error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function getIssueStatusesForWorker(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const data = await workerService.getIssueStatusesForWorker({
            workerId,
            organizationId,
        });
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error("getIssueStatusesForWorker error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function updateIssue(req: Request, res: Response) {
    try {
        const issueId = param(req, "issueId");
        const result = await workerService.updateIssue({
            issueId,
            actorUserId: req.userId!,
            ...req.body,
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("updateIssue error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function getIssueAuditLogs(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const issueId = param(req, "issueId");
        const data = await workerService.getIssueAuditLogs({
            workerId,
            issueId,
            organizationId,
        });
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error("getIssueAuditLogs error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function deleteIssue(req: Request, res: Response) {
    try {
        const issueId = param(req, "issueId");
        const { workerEngagementId } = req.body;
        await workerService.deleteIssue({ issueId, workerEngagementId });
        return res
            .status(200)
            .json({ success: true, message: "Issue deleted" });
    } catch (error: any) {
        console.error("deleteIssue error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function applyIssueTemplate(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const templateId = param(req, "templateId");
        const { workerEngagementId } = req.body;
        const result = await workerService.applyIssueTemplate({
            workerId,
            organizationId,
            templateId,
            workerEngagementId,
            actorUserId: req.userId!,
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("applyIssueTemplate error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function createAbsence(req: Request, res: Response) {
    try {
        const result = await workerService.createAbsence(req.body);
        return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        console.error("createAbsence error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function updateAbsence(req: Request, res: Response) {
    try {
        const absenceId = param(req, "absenceId");
        const result = await workerService.updateAbsence({
            absenceId,
            ...req.body,
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("updateAbsence error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function deleteAbsence(req: Request, res: Response) {
    try {
        const absenceId = param(req, "absenceId");
        await workerService.deleteAbsence({ absenceId });
        return res
            .status(200)
            .json({ success: true, message: "Absence deleted" });
    } catch (error: any) {
        console.error("deleteAbsence error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function uploadWorkerFile(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const uploadedByUserId = req.userId;

        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        if (files.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "No files uploaded" });
        }

        const stored = await Promise.all(
            files.map(async (file) => {
                const upload = await uploadFileToS3(
                    file,
                    workerId,
                    "upload/workers",
                );
                if (!upload.success || !upload.key) {
                    throw new Error(upload.error ?? "S3 upload failed");
                }

                return workerService.uploadWorkerDocument({
                    organizationId,
                    workerId,
                    uploadedByUserId,
                    name: file.originalname,
                    fileUrl: upload.key,
                    fileType: "other",
                    fileSizeBytes: file.size,
                    mimeType: file.mimetype,
                });
            }),
        );

        return res
            .status(201)
            .json({ success: true, files: stored, count: stored.length });
    } catch (error: any) {
        console.error("uploadWorkerFile error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function deleteWorkerFile(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const documentId = param(req, "fileId"); // route param stays as :fileId for back-compat

        await workerService.deleteWorkerDocument({
            organizationId,
            workerId,
            documentId,
        });
        return res
            .status(200)
            .json({ success: true, message: "Document deleted" });
    } catch (error: any) {
        console.error("deleteWorkerFile error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function getWorkerFiles(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const docs = await workerService.listWorkerDocuments({
            workerId,
            organizationId,
        });

        return res.status(200).json(docs);
    } catch (error: any) {
        console.error("getWorkerFiles error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export async function getWorkerHistory(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.getWorkerHistory({
            organizationId,
            workerId,
        });
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("getWorkerHistory error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
