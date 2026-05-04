import { uploadFileToS3 } from "@/config/aws";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";
import * as workerService from "../services/worker.service";

function param(req: Request, key: string): string {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : String(val);
}

export const createWorker = catchErrors(async (req: Request, res: Response) => {
    const organizationId = req.orgId;
    const createdByUserId = req.userId;
    const result = await workerService.createWorker({
        organizationId,
        createdByUserId,
        ...req.body,
    });
    return res.status(201).json({ success: true, data: result });
});

export const getWorkerData = catchErrors(
    async (req: Request, res: Response) => {
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
    },
);

export const getWorkerById = catchErrors(
    async (req: Request, res: Response) => {
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
    },
);

export const updateWorker = catchErrors(async (req: Request, res: Response) => {
    const organizationId = req.orgId;
    const workerId = param(req, "workerId");

    const result = await workerService.updateWorker({
        organizationId,
        workerId,
        updateData: req.body,
    });

    return res.status(200).json({ success: true, data: result });
});

export const archiveWorker = catchErrors(
    async (req: Request, res: Response) => {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.archiveWorker({
            organizationId,
            workerId,
        });

        return res.status(200).json({ success: true, data: result });
    },
);

export const unarchiveWorker = catchErrors(
    async (req: Request, res: Response) => {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.unarchiveWorker({
            organizationId,
            workerId,
        });
        return res.status(200).json({ success: true, data: result });
    },
);

export const deleteWorker = catchErrors(async (req: Request, res: Response) => {
    const organizationId = req.orgId;
    const workerId = param(req, "workerId");

    await workerService.deleteWorker({ organizationId, workerId });
    return res.status(200).json({ success: true, message: "Worker deleted" });
});

export const updateDataPoint = catchErrors(
    async (req: Request, res: Response) => {
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
    },
);

export const createEngagement = catchErrors(
    async (req: Request, res: Response) => {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.createEngagement({
            organizationId,
            workerId,
            ...req.body,
        });

        return res.status(201).json({ success: true, data: result });
    },
);

export const updateEngagement = catchErrors(
    async (req: Request, res: Response) => {
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
    },
);

export const deleteEngagement = catchErrors(
    async (req: Request, res: Response) => {
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
    },
);

export const createIssue = catchErrors(async (req: Request, res: Response) => {
    const result = await workerService.createIssue(req.body);
    return res.status(201).json({ success: true, data: result });
});

export const getIssueStatusesForWorker = catchErrors(
    async (req: Request, res: Response) => {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const data = await workerService.getIssueStatusesForWorker({
            workerId,
            organizationId,
        });
        return res.status(200).json({ success: true, data });
    },
);

export const updateIssue = catchErrors(async (req: Request, res: Response) => {
    const issueId = param(req, "issueId");
    const result = await workerService.updateIssue({
        issueId,
        actorUserId: req.userId!,
        ...req.body,
    });
    return res.status(200).json({ success: true, data: result });
});

export const getIssueAuditLogs = catchErrors(
    async (req: Request, res: Response) => {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");
        const issueId = param(req, "issueId");
        const data = await workerService.getIssueAuditLogs({
            workerId,
            issueId,
            organizationId,
        });
        return res.status(200).json({ success: true, data });
    },
);

export const deleteIssue = catchErrors(async (req: Request, res: Response) => {
    const issueId = param(req, "issueId");
    const { workerEngagementId } = req.body;
    await workerService.deleteIssue({ issueId, workerEngagementId });
    return res.status(200).json({ success: true, message: "Issue deleted" });
});

export const applyIssueTemplate = catchErrors(
    async (req: Request, res: Response) => {
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
    },
);

export const createAbsence = catchErrors(
    async (req: Request, res: Response) => {
        const result = await workerService.createAbsence(req.body);
        return res.status(201).json({ success: true, data: result });
    },
);

export const updateAbsence = catchErrors(
    async (req: Request, res: Response) => {
        const absenceId = param(req, "absenceId");
        const result = await workerService.updateAbsence({
            absenceId,
            ...req.body,
        });
        return res.status(200).json({ success: true, data: result });
    },
);

export const deleteAbsence = catchErrors(
    async (req: Request, res: Response) => {
        const absenceId = param(req, "absenceId");
        await workerService.deleteAbsence({ absenceId });
        return res
            .status(200)
            .json({ success: true, message: "Absence deleted" });
    },
);

export const uploadWorkerFile = catchErrors(
    async (req: Request, res: Response) => {
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
    },
);

export const deleteWorkerFile = catchErrors(
    async (req: Request, res: Response) => {
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
    },
);

export const getWorkerFiles = catchErrors(
    async (req: Request, res: Response) => {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const docs = await workerService.listWorkerDocuments({
            workerId,
            organizationId,
        });

        return res.status(200).json(docs);
    },
);

export const getWorkerHistory = catchErrors(
    async (req: Request, res: Response) => {
        const organizationId = req.orgId;
        const workerId = param(req, "workerId");

        const result = await workerService.getWorkerHistory({
            organizationId,
            workerId,
        });
        return res.status(200).json({ success: true, data: result });
    },
);
