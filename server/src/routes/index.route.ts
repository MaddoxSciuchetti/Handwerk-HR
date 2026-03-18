import { postFeature, sendReminder } from "@/controllers/index.controller";
import { upload } from "@/middleware/fileparser";
import catchErrors from "@/utils/catchErrors";
import { Router } from "express";

const indexRoutes = Router();

indexRoutes.post("/sendReminder", catchErrors(sendReminder));
indexRoutes.post("/featurerequest", upload.array("files"), postFeature);

export { indexRoutes };
