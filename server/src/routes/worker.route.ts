import express from "express";
import {
    addExtraField,
    createWorker,
    createWorkerFile,
    deleteWorker,
    deleteWorkerFile,
    getCloudUrl,
    getProcessData,
    getWorkerById,
    getWorkerData,
    getWorkerFiles,
    getWorkerHistory,
    postFeature,
    sendReminder,
    updateWorker,
    updateWorkerHistory,
} from "../controllers/on_off_boarding.controller";

import catchErrors from "@/utils/catchErrors";
import { upload } from "../middleware/fileparser";

const worker = express.Router();

//worker crud operations
worker.post("/addWorker", createWorker);

worker.get("/getWorkerData", getWorkerData);

worker.delete("/deleteWorker/:id", deleteWorker);

worker.get("/getWorker/:id", getWorkerById);

worker.put("/updateWorker", catchErrors(updateWorker));

// worker history Data

worker.get("/getWorkerHistory/:id", getWorkerHistory);

worker.post("/updateWorkerHistory", updateWorkerHistory);

// worker file Data

worker.post("/createWorkerFile/:id", upload.array("files"), createWorkerFile);

worker.get("/getWorkerFiles/:id", getWorkerFiles);

worker.delete("/deleteWorkerFile/:id", deleteWorkerFile);

worker.post("/addFormField", addExtraField);
worker.get("/fetchProcessdata/:id", getProcessData);

worker.post("/sendReminder", sendReminder);

worker.get("/getCloudUrl", getCloudUrl);

worker.post("/FeatureRequest", upload.array("files"), postFeature);

export { worker };
