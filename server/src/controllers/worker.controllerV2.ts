import { Request, Response } from "express";
import * as workerService from "../services/worker.serviceV2";

// Safely extract a single string param from Express (params are always string in practice,
// but typed as string | string[] in older @types/express versions)
function param(req: Request, key: string): string {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : String(val);
}

// ─── Create Worker ────────────────────────────────────────────────────────────
// Body: CreateWorkerInput fields
// Required: firstName, lastName, email, createdByUserId,
//           engagementType, responsibleUserId, engagementStatusId

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

// ─── Get Workers ───────────────────────────────────────────────────────────────
// Query: ?status=active|inactive|archived&search=&page=&limit=&includeArchived=true

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

// ─── Get Worker By ID ──────────────────────────────────────────────────────────
// Returns Worker + engagements + issues (nested under engagements) + documents w/ presigned URLs

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

// ─── Update Worker ────────────────────────────────────────────────────────────
// Body: UpdateWorkerInput (all optional, only real Worker fields)

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

// ─── Archive Worker ───────────────────────────────────────────────────────────
// Body: { archivedByUserId: string, archiveDate?: string }

export async function archiveWorker(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const { archiveDate } = req.body;
        const archivedByUserId = req.userId;

        const result = await workerService.archiveWorker({
            organizationId,
            workerId,
            archivedByUserId,
            archiveDate: archiveDate ? new Date(archiveDate) : undefined,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        console.error("archiveWorker error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// ─── Unarchive Worker ──────────────────────────────────────────────────────────

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

// ─── Delete Worker ────────────────────────────────────────────────────────────

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

// ─── Update Data Point ──────────────────────────────────────────────────────────
// Body: { field: keyof UpdateWorkerInput, value: any }

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

// ─── Engagements ───────────────────────────────────────────────────────────────
// Body for create: { responsibleUserId, statusId, type, startDate?, endDate? }

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

// ─── Issues ─────────────────────────────────────────────────────────────────────
// Issues belong to WorkerEngagement — route must pass engagementId in body or params
// Body for create: { workerEngagementId, createdByUserId, statusId, title, ... }

export async function createIssue(req: Request, res: Response) {
    try {
        // workerEngagementId comes from body since issues don't route via workerId
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

// ─── Absences ─────────────────────────────────────────────────────────────────
// Absence belongs to NewUser (userId) + Organization (orgId) — NOT Worker
// Body for create: { userId, orgId, absenceType, startDate, endDate, substituteId? }

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

// ─── Documents (replaces WorkerFile) ────────────────────────────────────────────
// Body: { uploadedByUserId, name, fileUrl, fileType, fileSizeBytes?, mimeType? }
// fileUrl = S3 key or full URL set by upload middleware before reaching this handler

export async function uploadWorkerFile(req: Request, res: Response) {
    try {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const uploadedByUserId = req.userId;

        const { name, fileUrl, fileType, fileSizeBytes, mimeType } = req.body;

        if (!fileUrl) {
            return res
                .status(400)
                .json({ success: false, message: "fileUrl is required" });
        }

        const result = await workerService.uploadWorkerDocument({
            organizationId,
            workerId,
            uploadedByUserId,
            name,
            fileUrl,
            fileType,
            fileSizeBytes: fileSizeBytes
                ? parseInt(fileSizeBytes, 10)
                : undefined,
            mimeType,
        });

        return res.status(201).json({ success: true, data: result });
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

// ─── History ─────────────────────────────────────────────────────────────────
// Returns all engagements (with nested issues) + documents for audit trail

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
