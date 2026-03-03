import express from "express";
import {
    addExtraField,
    createWorker,
    deleteFileData,
    deleteWorker,
    getCloudUrl,
    getFileData,
    getProcessData,
    getWorkerById,
    getWorkerData,
    getWorkerHistory,
    postFeature,
    postFileData,
    sendReminder,
    updateWorker,
    updateWorkerHistory,
} from "../controllers/on_off_boarding.controller";

import catchErrors from "@/utils/catchErrors";
import { upload } from "../middleware/fileparser";

const worker = express.Router();

worker.post("/addWorker", createWorker);

worker.get("/getWorkerData", getWorkerData);

worker.delete("/deleteWorker/:id", deleteWorker);

worker.get("/getWorker/:id", getWorkerById);

worker.put("/updateWorker", catchErrors(updateWorker));

// above worker CRUD operations

worker.get("/getWorkerHistory/:id", getWorkerHistory);

worker.post("/updateWorkerHistory", updateWorkerHistory);

worker.post("/editdata/file/:id", upload.array("files"), postFileData);

worker.post("/addFormField", addExtraField);

worker.get("/getFileData/file/:id", getFileData);

worker.get("/fetchProcessdata/:id", getProcessData);

worker.delete("/deleteFileData/:id", deleteFileData);

worker.post("/sendReminder", sendReminder);

worker.get("/getCloudUrl", getCloudUrl);

worker.post("/FeatureRequest", upload.array("files"), postFeature);

export { worker };
