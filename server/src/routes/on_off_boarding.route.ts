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
} from "../controllers/on_off_boarding.controller.ts";
import { upload } from "../middleware/fileparser.ts";

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

offboarding_router.get("/getFileData/file/:id", getFileData);

offboarding_router.get("/fetchProcessdata/:id", getProcessData);

offboarding_router.delete("/deleteFileData/:id", deleteFileData);

offboarding_router.post("/sendReminder", sendReminder);

export { offboarding_router };
