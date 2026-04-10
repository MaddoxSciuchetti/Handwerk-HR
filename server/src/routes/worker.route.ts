import express from "express";

import {
    addWorkerTask,
    archiveWorkerById,
    createWorker,
    createWorkerFile,
    deleteWorker,
    deleteWorkerFile,
    getCloudUrl,
    getWorkerById,
    getWorkerData,
    getWorkerFiles,
    getWorkerHistory,
    unarchiveWorkerById,
    updateDataPoint,
    updateWorker,
    updateWorkerHistory,
} from "@/controllers/worker.controller";
import catchErrors from "@/utils/catchErrors";
import { upload } from "../middleware/fileparser";

import * as workerController from "../controllers/worker.controllerV2";

const worker = express.Router();

//worker crud operations old
worker.post("/addWorker", catchErrors(createWorker));
worker.get("/getWorkerData", getWorkerData);
worker.put("/archiveWorker/:id", archiveWorkerById);
worker.put("/unarchiveWorker/:id", unarchiveWorkerById);
worker.delete("/deleteWorker/:id", deleteWorker);
worker.get("/getWorker/:id", getWorkerById);
worker.put("/updateWorker", catchErrors(updateWorker));
worker.put("/singleWorkerDataPoint", catchErrors(updateDataPoint));
worker.post("/createWorkerTask/:workerId", catchErrors(addWorkerTask));

// worker history Data

worker.get("/getWorkerHistory/:id", getWorkerHistory);
worker.post("/updateWorkerHistory", updateWorkerHistory);

// worker file Data

worker.post("/createWorkerFile/:id", upload.array("files"), createWorkerFile);
worker.get("/getWorkerFiles/:id", getWorkerFiles);
worker.get("/getCloudUrl", getCloudUrl);
worker.delete("/deleteWorkerFile/:id", deleteWorkerFile);

// new routes

worker.post("/", workerController.createWorker);
worker.get("/", workerController.getWorkerData);
worker.get("/:workerId", workerController.getWorkerById);
worker.put("/:workerId", workerController.updateWorker);
worker.delete("/:workerId", workerController.deleteWorker);

// Archive / Unarchive
worker.patch("/:workerId/archive", workerController.archiveWorker);
worker.patch("/:workerId/unarchive", workerController.unarchiveWorker);

// Engagements
worker.post("/:workerId/engagements", workerController.createEngagement);
worker.put(
    "/:workerId/engagements/:engagementId",
    workerController.updateEngagement,
);
worker.delete(
    "/:workerId/engagements/:engagementId",
    workerController.deleteEngagement,
);

// Issues
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

// Absences
worker.post("/:workerId/absences", workerController.createAbsence);
worker.put("/:workerId/absences/:absenceId", workerController.updateAbsence);
worker.delete("/:workerId/absences/:absenceId", workerController.deleteAbsence);

// Data Points
worker.patch("/:workerId/data-points", workerController.updateDataPoint);

// Files
worker.post(
    "/:workerId/files",
    upload.single("file"),
    workerController.uploadWorkerFile,
);
worker.delete("/:workerId/files/:fileId", workerController.deleteWorkerFile);

// History
worker.get("/:workerId/history", workerController.getWorkerHistory);

export { worker };
