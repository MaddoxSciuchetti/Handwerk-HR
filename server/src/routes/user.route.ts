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
    deleteEmplyoee,
    editAbsenceData,
    editDescriptionHandler,
    fetchDescriptionHandler,
    getEmployee,
    getEmployeeWorkerData,
    getProfilePhoto,
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

// crud operations with users (that are employee)
userRoutes.get(
    "/employee/getEmployeeWorkerData",
    checkChef,
    getEmployeeWorkerData,
);

userRoutes.get("/employee/specificEmployeeData", checkChef, getEmployee);

userRoutes.delete("/deleteEmplyoee/:id", checkChef, deleteEmplyoee);

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
