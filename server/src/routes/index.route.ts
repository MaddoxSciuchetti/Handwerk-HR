import { postFeature, sendReminder } from "@/controllers/index.controller";
import { upload } from "@/middleware/fileparser";
import { Router } from "express";

const indexRoutes = Router();

indexRoutes.post("/sendReminder", sendReminder);
indexRoutes.post("/featurerequest", upload.array("files"), postFeature);

export { indexRoutes };
