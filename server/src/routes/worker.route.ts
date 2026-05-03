import express from "express";

import { upload } from "../middleware/fileparser";

import * as workerController from "../controllers/worker.controller";

const worker = express.Router();


worker.post("/", workerController.createWorker);
worker.get("/", workerController.getWorkerData);
worker.get("/:workerId", workerController.getWorkerById);
worker.put("/:workerId", workerController.updateWorker);
worker.delete("/:workerId", workerController.deleteWorker);

worker.patch("/:workerId/archive", workerController.archiveWorker);
worker.patch("/:workerId/unarchive", workerController.unarchiveWorker);

worker.post("/:workerId/engagements", workerController.createEngagement);
worker.put(
    "/:workerId/engagements/:engagementId",
    workerController.updateEngagement,
);
worker.delete(
    "/:workerId/engagements/:engagementId",
    workerController.deleteEngagement,
);

worker.get(
    "/:workerId/issue-statuses",
    workerController.getIssueStatusesForWorker,
);
worker.get(
    "/:workerId/issues/:issueId/audit-logs",
    workerController.getIssueAuditLogs,
);
worker.post("/:workerId/issues", workerController.createIssue);
worker.put("/:workerId/issues/:issueId", workerController.updateIssue);
worker.delete("/:workerId/issues/:issueId", workerController.deleteIssue);

worker.post(
    "/:workerId/templates/:templateId/apply",
    workerController.applyIssueTemplate,
);

worker.post("/:workerId/absences", workerController.createAbsence);
worker.put("/:workerId/absences/:absenceId", workerController.updateAbsence);
worker.delete("/:workerId/absences/:absenceId", workerController.deleteAbsence);

worker.patch("/:workerId/data-points", workerController.updateDataPoint);

worker.post(
    "/:workerId/files",
    upload.array("files"),
    workerController.uploadWorkerFile,
);
worker.get("/:workerId/files", workerController.getWorkerFiles);
worker.delete("/:workerId/files/:fileId", workerController.deleteWorkerFile);

worker.get("/:workerId/history", workerController.getWorkerHistory);

export { worker };
