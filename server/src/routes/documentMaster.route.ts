import { Router } from "express";
import {
    createMaster,
    getMaster,
    listMasters,
    updateMaster,
    getDocumentFontStatus,
} from "@/controllers/documentMaster.controller";
import { upload } from "@/middleware/fileparser";

const documentMasterRoutes = Router();

documentMasterRoutes.get("/", listMasters);
documentMasterRoutes.get("/font-status", getDocumentFontStatus);
documentMasterRoutes.post("/", upload.single("file"), createMaster);
documentMasterRoutes.get("/:id", getMaster);
documentMasterRoutes.put("/:id", updateMaster);

export { documentMasterRoutes };
