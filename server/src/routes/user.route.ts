import {
    addExtraField,
    postFeature,
    sendReminder,
} from "@/controllers/on_off_boarding.controller";
import { upload } from "@/middleware/fileparser";
import { checkChef } from "@/utils/checkChef";
import { Router } from "express";
import {
    createDescriptionHandler,
    deleteDescriptionHandler,
    deleteEmployeeHandler,
    editAbsenceData,
    editDescriptionHandler,
    fetchDescriptionHandler,
    getEmployeedata,
    getProfilePhoto,
    getUnifiedData,
    getUser,
    uploadProfilePhoto,
} from "../controllers/user.controller";

const userRoutes = Router();

// prefix /user

userRoutes.get("/", getUser);

// profile

userRoutes.post("/profile/photo", upload.single("file"), uploadProfilePhoto);

userRoutes.get("/profile/photo", getProfilePhoto);

// userRoutes.get("/chefpermission", checkChef, getChefHandler);

userRoutes.get("/employeeData", checkChef, getUnifiedData);

userRoutes.get("/specificEmployeeData", checkChef, getEmployeedata);

userRoutes.delete("/deleteEmplyoee/:id", checkChef, deleteEmployeeHandler);

userRoutes.put("/editAbsenceData", checkChef, editAbsenceData);

userRoutes.delete(
    "/deleteDescriptionData/:id",
    checkChef,
    deleteDescriptionHandler,
);
userRoutes.get("/fetchTaskData", checkChef, fetchDescriptionHandler);

userRoutes.post("/addFormField", addExtraField);

userRoutes.get("/rawdescription", checkChef, fetchDescriptionHandler);

userRoutes.put("/editTaskData/:id", checkChef, editDescriptionHandler);

userRoutes.post("/sendReminder", sendReminder);

userRoutes.post("/featurerequest", upload.array("files"), postFeature);

userRoutes.post("/createTaskData", checkChef, createDescriptionHandler);
export default userRoutes;
