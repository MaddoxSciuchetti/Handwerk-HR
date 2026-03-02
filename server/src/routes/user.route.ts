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
    getChefHandler,
    getEmployeedata,
    getProfileFoto,
    getUnifiedData,
    getUserHandler,
    postProfileFoto,
} from "../controllers/user.controller";

const userRoutes = Router();

// prefix /user

userRoutes.get("/", getUserHandler);

userRoutes.post("/uploadProfileFoto", upload.single("file"), postProfileFoto);

userRoutes.get("/getProfileFoto", getProfileFoto);

userRoutes.get("/chefpermission", checkChef, getChefHandler);

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

userRoutes.get("/rawdescription", checkChef, fetchDescriptionHandler);

userRoutes.put("/editTaskData/:id", checkChef, editDescriptionHandler);

userRoutes.post("/createTaskData", checkChef, createDescriptionHandler);
export default userRoutes;
