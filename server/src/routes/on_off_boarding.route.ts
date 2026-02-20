import express from "express";
import {
    postOffboardingData,
    fetchOffboardingData,
    offboardingGetuserbyId,
    offboardingEditdata,
    offboardingDeletebyId,
    postHistoryData,
    gethistoryData,
    postFileData,
    getProcessData,
    getFileData,
    deleteFileData,
    sendReminder,
    addExtraField,
    getCloudUrl,
} from "../controllers/on_off_boarding.controller";

import { upload } from "../middleware/fileparser";
import { GetObjectLockConfiguration$ } from "@aws-sdk/client-s3";

const offboarding_router = express.Router();

offboarding_router.post("/postoffboardingdata", postOffboardingData);

offboarding_router.get("/fetchData", fetchOffboardingData);

offboarding_router.delete("/delete/:id", offboardingDeletebyId);

offboarding_router.get("/user/:id", offboardingGetuserbyId);

offboarding_router.put("/editdata", offboardingEditdata);

offboarding_router.get("/getHistoryData/:id", gethistoryData);

offboarding_router.post("/editHisoryData", postHistoryData);

offboarding_router.post(
    "/editdata/file/:id",
    upload.array("files"),
    postFileData,
);

offboarding_router.post("/addFormField", addExtraField);

offboarding_router.get("/getFileData/file/:id", getFileData);

offboarding_router.get("/fetchProcessdata/:id", getProcessData);

offboarding_router.delete("/deleteFileData/:id", deleteFileData);

offboarding_router.post("/sendReminder", sendReminder);

offboarding_router.get("/getCloudUrl", getCloudUrl);

export { offboarding_router };
