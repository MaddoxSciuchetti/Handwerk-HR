import { listBsbMailAddresses } from '@/services/engagementMail';
import { deleteWorkersSchema } from '@/schemas/worker.schemas';
import { templateApplyInput, templateApplicationPreview, readTemplateApplication, dismissTemplateApplicationResults } from '@/services/templateApplication';
import { getLifecycleStatistics as fetchLifecycleStatistics } from "@/services/lifecycleStatistics";
import { uploadFileToS3 } from "@/config/aws";
import * as employmentContractService from "@/services/employmentContract.service";
import { confirmReturnedEmploymentContract } from "@/services/signedContractReturn.service";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";
import {
    getQuestionnaireDraft,
    saveQuestionnaireDraft,
    sendEngagementQuestionnaire,
} from "@/services/questionnaireDispatch";
import * as workerService from "../services/worker.service";
import { saveCompletedQuestionnaire } from "@/services/questionnaireCorrections.service";
import { getCompletedQuestionnaire } from "@/services/completedQuestionnaire.service";
import {
    fileCompletedQuestionnaire,
    renameQuestionnaireFile,
} from "@/services/questionnaireFiles.service";

export const getCompletedEngagementQuestionnaire = catchErrors(
    async (req: Request, res: Response) => {
        const data = await getCompletedQuestionnaire({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
        });
        return res.status(200).json({ success: true, data });
    },
);

export const saveCompletedEngagementQuestionnaire = catchErrors(
    async (req: Request, res: Response) => {
        const params = {
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
        };
        await saveCompletedQuestionnaire({ ...params, changedByUserId: req.userId, input: req.body });
        const data = await getCompletedQuestionnaire(params);
        return res.status(200).json({ success: true, data });
    },
);

export const fileCompletedQuestionnaireFiles = catchErrors(
    async (req: Request, res: Response) => {
        const questionKey =
            typeof req.body?.questionKey === "string" ? req.body.questionKey : undefined;
        await fileCompletedQuestionnaire({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
            uploadedByUserId: req.userId,
            questionKey,
        });
        return res.status(200).json({ success: true });
    },
);

export const renameCompletedQuestionnaireFile = catchErrors(
    async (req: Request, res: Response) => {
        const questionKey = typeof req.body?.questionKey === "string" ? req.body.questionKey : "";
        const name = typeof req.body?.name === "string" ? req.body.name : "";
        const data = await renameQuestionnaireFile({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
            questionKey,
            name,
        });
        return res.status(200).json({ success: true, data });
    },
);

function param(req: Request, key: string): string {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : String(val);
}

export const getQuestionnaireSenders = catchErrors(async (req, res) => {
    const data = await listBsbMailAddresses(req.orgId);
    return res.status(200).json({ success: true, data });
});

export const startExpectedOnboarding = catchErrors(
    async (req: Request, res: Response) => {
        const email = String(req.body?.email ?? "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res
                .status(400)
                .json({ success: false, message: "E-Mail fehlt." });
        }

        const result = await workerService.startExpectedOnboarding({
            organizationId: req.orgId,
            createdByUserId: req.userId,
            email,
        });

        return res.status(201).json({ success: true, data: result });
    },
);

export const getEngagementQuestionnaire = catchErrors(
    async (req: Request, res: Response) => {
        const draft = await getQuestionnaireDraft({
            organizationId: req.orgId,
            engagementId: param(req, "engagementId"),
        });
        return res.status(200).json({ success: true, data: draft });
    },
);

export const saveEngagementQuestionnaire = catchErrors(
    async (req: Request, res: Response) => {
        const draft = await saveQuestionnaireDraft({
            organizationId: req.orgId,
            engagementId: param(req, "engagementId"),
            values: req.body?.values ?? req.body,
            questions: req.body?.questions,
            definition: req.body?.definition,
        });
        return res.status(200).json({ success: true, data: draft });
    },
);

export const sendEngagementQuestionnaireHandler = catchErrors(
    async (req: Request, res: Response) => {
        const result = await sendEngagementQuestionnaire({
            organizationId: req.orgId,
            createdByUserId: req.userId,
            engagementId: param(req, "engagementId"),
        });
        return res.status(200).json({ success: true, data: result });
    },
);

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
            viewerUserId: req.userId,
            status: status as any,
            search: search as string | undefined,
            page: page ? parseInt(page as string, 10) : 1,
            limit: limit ? parseInt(limit as string, 10) : 25,
            includeArchived: includeArchived === "true",
            summary: req.query.summary === "true",
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
            req.userId,
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

export const deleteWorkers = catchErrors(async (req: Request, res: Response) => {
    const { workerIds } = deleteWorkersSchema.parse(req.body);
    const result = await workerService.deleteWorkers({ organizationId: req.orgId, workerIds });
    return res.status(200).json({ success: true, data: result });
});

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
        const input = templateApplyInput.parse(req.body);
        const result = await workerService.applyIssueTemplate({
            workerId,
            organizationId,
            templateId,
            ...input,
            actorUserId: req.userId!,
            remainingOnly: true,
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
            viewerUserId: req.userId,
        });
        return res.status(200).json({ success: true, data: result });
    },
);

export const getEngagementContract = catchErrors(
    async (req: Request, res: Response) => {
        const contract = await employmentContractService.getEngagementContract({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
        });
        if (!contract) {
            return res
                .status(404)
                .json({ success: false, message: "Vertrag nicht gefunden." });
        }
        return res.status(200).json({ success: true, data: contract });
    },
);

export const saveEngagementContractDraft = catchErrors(
    async (req: Request, res: Response) => {
        const values = req.body?.values;
        if (
            values === null ||
            typeof values !== "object" ||
            Array.isArray(values)
        ) {
            return res
                .status(400)
                .json({ success: false, message: "Werte fehlen." });
        }

        const contract =
            await employmentContractService.saveEngagementContractDraft({
                organizationId: req.orgId,
                workerId: param(req, "workerId"),
                engagementId: param(req, "engagementId"),
                values: values as Record<string, unknown>,
            });
        return res.status(200).json({ success: true, data: contract });
    },
);

export const selectEngagementContractTemplate = catchErrors(
    async (req: Request, res: Response) => {
        const masterId = req.body?.masterId;
        if (typeof masterId !== "string" || !masterId.trim() || masterId.length > 120) {
            return res.status(400).json({ success: false, message: "Vertragsvorlage fehlt." });
        }
        const contract = await employmentContractService.resyncEngagementContractFromQuestionnaire({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
            masterId: masterId.trim(),
        });
        return res.status(200).json({ success: true, data: contract });
    },
);

export const resyncEngagementContractFromQuestionnaire = catchErrors(
    async (req: Request, res: Response) => {
        const contract =
            await employmentContractService.resyncEngagementContractFromQuestionnaire(
                {
                    organizationId: req.orgId,
                    workerId: param(req, "workerId"),
                    engagementId: param(req, "engagementId"),
                },
            );
        return res.status(200).json({ success: true, data: contract });
    },
);

export const confirmEngagementContractForSend = catchErrors(
    async (req: Request, res: Response) => {
        const contract =
            await employmentContractService.confirmEngagementContractForSend({
                organizationId: req.orgId,
                workerId: param(req, "workerId"),
                engagementId: param(req, "engagementId"),
            });
        return res.status(200).json({ success: true, data: contract });
    },
);

export const confirmReturnedEmploymentContractHandler = catchErrors(
    async (req: Request, res: Response) => {
        const issueId = String(req.body?.issueId ?? "").trim();
        if (!issueId) {
            return res
                .status(400)
                .json({ success: false, message: "Aufgabe fehlt." });
        }

        await confirmReturnedEmploymentContract({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
            actorUserId: req.userId,
            issueId,
        });
        const contract = await employmentContractService.getEngagementContract({
            organizationId: req.orgId,
            workerId: param(req, "workerId"),
            engagementId: param(req, "engagementId"),
        });
        return res.status(200).json({ success: true, data: contract });
    },
);

export const readPreparedEmploymentContractPdf = catchErrors(
    async (req: Request, res: Response) => {
        const bytes =
            await employmentContractService.readPreparedEmploymentContractPdf({
                organizationId: req.orgId,
                workerId: param(req, "workerId"),
                engagementId: param(req, "engagementId"),
                artifactId: param(req, "artifactId"),
            });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            'inline; filename="Arbeitsvertrag.pdf"',
        );
        res.setHeader("Cache-Control", "no-store");
        return res.send(bytes);
    },
);

export const sendFilledEmploymentContract = catchErrors(
    async (req: Request, res: Response) => {
        const issueId = String(req.body?.issueId ?? "").trim();
        const artifactId = String(req.body?.artifactId ?? "").trim();
        if (!issueId) {
            return res
                .status(400)
                .json({ success: false, message: "Aufgabe fehlt." });
        }
        if (!artifactId) {
            return res.status(400).json({
                success: false,
                message: "Bitte das PDF zuerst erstellen und prüfen.",
            });
        }

        const contract =
            await employmentContractService.sendFilledEmploymentContract({
                organizationId: req.orgId,
                workerId: param(req, "workerId"),
                engagementId: param(req, "engagementId"),
                actorUserId: req.userId,
                issueId,
                artifactId,
            });
        return res.status(200).json({ success: true, data: contract });
    },
);

export const prepareEmploymentContractPdf = catchErrors(
    async (req: Request, res: Response) => {
        const values = req.body?.values;
        if (!values || typeof values !== "object" || Array.isArray(values))
            return res.status(400).json({ message: "Werte fehlen." });
        const prepared =
            await employmentContractService.prepareEmploymentContractPdf({
                organizationId: req.orgId,
                workerId: param(req, "workerId"),
                engagementId: param(req, "engagementId"),
                values,
            });
        return res.json({ success: true, data: prepared });
    },
);

export const getLifecycleStatistics = catchErrors(async (req: Request, res: Response) => {
    const data = await fetchLifecycleStatistics(req.orgId, req.userId);
    return res.status(200).json({ success: true, data });
});

export const previewIssueTemplate = catchErrors(async (req: Request, res: Response) => {
    const engagementId = String(req.query.workerEngagementId ?? '');
    const data = await templateApplicationPreview({
        workerId: param(req, 'workerId'), templateId: param(req, 'templateId'),
        organizationId: req.orgId, actorUserId: req.userId!,
    }, engagementId);
    return res.status(200).json({ success: true, data });
});


export const getTemplateApplication = catchErrors(async (req: Request, res: Response) => {
    const data = await readTemplateApplication({
        workerId: param(req, "workerId"), organizationId: req.orgId,
    }, String(req.query.workerEngagementId ?? ""));
    return res.status(200).json({ success: true, data });
});

export const dismissTemplateApplication = catchErrors(async (req: Request, res: Response) => {
    const engagementId = String(req.body?.workerEngagementId ?? "");
    if (!engagementId) return res.status(400).json({ message: "Einsatz fehlt." });
    const data = await dismissTemplateApplicationResults({
        workerId: param(req, "workerId"), organizationId: req.orgId,
    }, engagementId);
    return res.status(200).json({ success: true, data });
});
