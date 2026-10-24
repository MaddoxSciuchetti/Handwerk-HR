import express from "express";

import { upload } from "../middleware/fileparser";

import * as engagementClothingController from "../controllers/engagementClothing.controller";
import * as engagementMaterialController from "../controllers/engagementMaterial.controller";
import * as engagementTemplateDocumentController from "../controllers/engagementTemplateDocument.controller";
import * as personnelDocumentController from "../controllers/personnelDocument.controller";
import * as workerController from "../controllers/worker.controller";

const worker = express.Router();
worker.post(
    "/:workerId/engagements/:engagementId/contract/prepare-pdf",
    workerController.prepareEmploymentContractPdf,
);
worker.get(
    "/:workerId/engagements/:engagementId/contract/prepared-pdf/:artifactId",
    workerController.readPreparedEmploymentContractPdf,
);

worker.post("/", workerController.createWorker);
worker.post("/bulk-delete", workerController.deleteWorkers);
worker.post("/fast-track", workerController.startExpectedOnboarding);
worker.get(
    "/engagements/:engagementId/questionnaire",
    workerController.getEngagementQuestionnaire,
);
worker.put(
    "/engagements/:engagementId/questionnaire",
    workerController.saveEngagementQuestionnaire,
);
worker.post(
    "/engagements/:engagementId/questionnaire/send",
    workerController.sendEngagementQuestionnaireHandler,
);
worker.get("/", workerController.getWorkerData);
worker.get("/statistics", workerController.getLifecycleStatistics);
worker.get("/:workerId", workerController.getWorkerById);
worker.put("/:workerId", workerController.updateWorker);
worker.delete("/:workerId", workerController.deleteWorker);

worker.patch("/:workerId/archive", workerController.archiveWorker);
worker.patch("/:workerId/unarchive", workerController.unarchiveWorker);

worker.post("/:workerId/engagements", workerController.createEngagement);
worker.get(
    "/:workerId/engagements/:engagementId/questionnaire/completed",
    workerController.getCompletedEngagementQuestionnaire,
);
worker.put(
    "/:workerId/engagements/:engagementId/questionnaire/completed",
    workerController.saveCompletedEngagementQuestionnaire,
);
worker.post(
    "/:workerId/engagements/:engagementId/questionnaire/files",
    workerController.fileCompletedQuestionnaireFiles,
);
worker.patch(
    "/:workerId/engagements/:engagementId/questionnaire/files",
    workerController.renameCompletedQuestionnaireFile,
);
worker.get(
    "/:workerId/engagements/:engagementId/contract",
    workerController.getEngagementContract,
);
worker.put(
    "/:workerId/engagements/:engagementId/contract",
    workerController.saveEngagementContractDraft,
);
worker.post(
    "/:workerId/engagements/:engagementId/contract/confirm-send",
    workerController.confirmEngagementContractForSend,
);
worker.post(
    "/:workerId/engagements/:engagementId/contract/template",
    workerController.selectEngagementContractTemplate,
);
worker.post(
    "/:workerId/engagements/:engagementId/contract/resync",
    workerController.resyncEngagementContractFromQuestionnaire,
);
worker.get(
    "/:workerId/engagements/:engagementId/template-documents",
    engagementTemplateDocumentController.listEngagementTemplateDocuments,
);
worker.post(
    "/:workerId/engagements/:engagementId/template-documents",
    engagementTemplateDocumentController.createEngagementTemplateDocument,
);
worker.get(
    "/:workerId/engagements/:engagementId/template-documents/:documentId",
    engagementTemplateDocumentController.getEngagementTemplateDocument,
);
worker.put(
    "/:workerId/engagements/:engagementId/template-documents/:documentId",
    engagementTemplateDocumentController.saveEngagementTemplateDocument,
);
worker.post(
    "/:workerId/engagements/:engagementId/template-documents/:documentId/sync",
    engagementTemplateDocumentController.syncEngagementTemplateDocument,
);
worker.post(
    "/:workerId/engagements/:engagementId/template-documents/:documentId/print",
    engagementTemplateDocumentController.printEngagementTemplateDocument,
);
worker.post(
    "/:workerId/engagements/:engagementId/contract/send",
    workerController.sendFilledEmploymentContract,
);
worker.post(
    "/:workerId/engagements/:engagementId/contract/confirm-return",
    workerController.confirmReturnedEmploymentContractHandler,
);
worker.get(
    "/:workerId/engagements/:engagementId/materials",
    engagementMaterialController.listEngagementMaterials,
);
worker.post(
    "/:workerId/engagements/:engagementId/materials",
    upload.single("file"),
    engagementMaterialController.uploadEngagementMaterial,
);
worker.patch(
    "/:workerId/engagements/:engagementId/materials/:materialId",
    engagementMaterialController.updateEngagementMaterial,
);
worker.delete(
    "/:workerId/engagements/:engagementId/materials/:materialId",
    engagementMaterialController.deleteEngagementMaterial,
);

worker.get(
    "/:workerId/engagements/:engagementId/clothing",
    engagementClothingController.listEngagementClothingHandler,
);
worker.post(
    "/:workerId/engagements/:engagementId/clothing",
    engagementClothingController.postEngagementClothing,
);
worker.post(
    "/:workerId/engagements/:engagementId/clothing/:clothingId/return",
    engagementClothingController.returnEngagementClothingHandler,
);
worker.delete(
    "/:workerId/engagements/:engagementId/clothing/:clothingId",
    engagementClothingController.removeEngagementClothing,
);

worker.get(
    "/:workerId/personnel-documents",
    personnelDocumentController.listPersonnelDocuments,
);
worker.post(
    "/:workerId/engagements/:engagementId/personnel-folders",
    personnelDocumentController.createPersonnelFolder,
);
worker.post(
    "/:workerId/engagements/:engagementId/personnel-documents",
    upload.single("file"),
    personnelDocumentController.uploadPersonnelDocument,
);
worker.patch(
    "/:workerId/personnel-documents/:documentId",
    personnelDocumentController.renamePersonnelDocument,
);
worker.delete(
    "/:workerId/personnel-documents/:documentId",
    personnelDocumentController.deletePersonnelDocument,
);

worker.put(
    "/:workerId/engagements/:engagementId",
    workerController.updateEngagement,
);
worker.delete(
    "/:workerId/engagements/:engagementId",
    workerController.deleteEngagement,
);

worker.get(
    "/:workerId/issues/:issueId/audit-logs",
    workerController.getIssueAuditLogs,
);
worker.post("/:workerId/issues", workerController.createIssue);
worker.put("/:workerId/issues/:issueId", workerController.updateIssue);
worker.delete("/:workerId/issues/:issueId", workerController.deleteIssue);

worker.get("/:workerId/template-application", workerController.getTemplateApplication);
worker.post("/:workerId/template-application/dismiss", workerController.dismissTemplateApplication);
worker.get("/:workerId/templates/:templateId/preview", workerController.previewIssueTemplate);
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
