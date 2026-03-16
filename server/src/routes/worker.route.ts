import express from "express";

import {
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
    updateWorker,
    updateWorkerHistory,
} from "@/controllers/worker.controller";
import catchErrors from "@/utils/catchErrors";
import { upload } from "../middleware/fileparser";

const worker = express.Router();

//worker crud operations
worker.post("/addWorker", catchErrors(createWorker));
worker.get("/getWorkerData", getWorkerData);
worker.put("/archiveWorker/:id", archiveWorkerById);
worker.put("/unarchiveWorker/:id", unarchiveWorkerById);
worker.delete("/deleteWorker/:id", deleteWorker);
worker.get("/getWorker/:id", getWorkerById);
worker.put("/updateWorker", catchErrors(updateWorker));

// worker history Data

worker.get("/getWorkerHistory/:id", getWorkerHistory);
worker.post("/updateWorkerHistory", updateWorkerHistory);

// worker file Data

worker.post("/createWorkerFile/:id", upload.array("files"), createWorkerFile);
worker.get("/getWorkerFiles/:id", getWorkerFiles);
worker.get("/getCloudUrl", getCloudUrl);
worker.delete("/deleteWorkerFile/:id", deleteWorkerFile);

export { worker };
