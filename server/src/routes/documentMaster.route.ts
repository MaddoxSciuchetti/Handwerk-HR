import { Router } from "express";
import {
  createMaster,
  getMaster,
  listMasters,
  setPrimaryMaster,
  duplicateMaster,
  deleteMaster,
  updateMaster,
  getDocumentFontStatus,
  previewMasterPdf,
  searchSharePointMasters,
  importSharePointMaster,
} from "@/controllers/documentMaster.controller";
import { upload } from "@/middleware/fileparser";

import {
  getDescriptionSentences,
  createDescriptionSentence,
} from "@/controllers/descriptionSentences.controller";

const documentMasterRoutes = Router();

documentMasterRoutes.get("/description-sentences", getDescriptionSentences);
documentMasterRoutes.post("/description-sentences", createDescriptionSentence);

documentMasterRoutes.get("/", listMasters);
documentMasterRoutes.get("/font-status", getDocumentFontStatus);
documentMasterRoutes.get("/sharepoint/search", searchSharePointMasters);
documentMasterRoutes.post("/sharepoint/import", importSharePointMaster);
documentMasterRoutes.post("/", upload.single("file"), createMaster);
documentMasterRoutes.get("/:id/preview.pdf", previewMasterPdf);
documentMasterRoutes.post("/:id/preview.pdf", previewMasterPdf);
documentMasterRoutes.post("/:id/primary", setPrimaryMaster);
documentMasterRoutes.post("/:id/duplicate", duplicateMaster);
documentMasterRoutes.get("/:id", getMaster);
documentMasterRoutes.put("/:id", updateMaster);
documentMasterRoutes.delete("/:id", deleteMaster);

export { documentMasterRoutes };
