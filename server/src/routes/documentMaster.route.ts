import { Router } from "express";
import {
  createMaster,
  getMaster,
  listMasters,
  setPrimaryMaster,
  deleteMaster,
  updateMaster,
  getDocumentFontStatus,
  previewMasterPdf,
} from "@/controllers/documentMaster.controller";
import { upload } from "@/middleware/fileparser";

const documentMasterRoutes = Router();

documentMasterRoutes.get("/", listMasters);
documentMasterRoutes.get("/font-status", getDocumentFontStatus);
documentMasterRoutes.post("/", upload.single("file"), createMaster);
documentMasterRoutes.get("/:id/preview.pdf", previewMasterPdf);
documentMasterRoutes.post("/:id/preview.pdf", previewMasterPdf);
documentMasterRoutes.post("/:id/primary", setPrimaryMaster);
documentMasterRoutes.get("/:id", getMaster);
documentMasterRoutes.put("/:id", updateMaster);
documentMasterRoutes.delete("/:id", deleteMaster);

export { documentMasterRoutes };
