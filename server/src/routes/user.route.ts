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
import { checkChef } from "@/utils/checkChef";
import { upload } from "@/middleware/fileparser";

const userRoutes = Router();

// prefix /user

userRoutes.get("/", getUserHandler);

userRoutes.post("/uploadProfileFoto", upload.single("file"), postProfileFoto);

userRoutes.get("/getProfileFoto", getProfileFoto);

userRoutes.get("/chefpermission", checkChef, getChefHandler);

// employee data

// fetch employee tasks
userRoutes.get("/employeeData", checkChef, getUnifiedData);

// get EmployeeData
userRoutes.get("/specificEmployeeData", checkChef, getEmployeedata);

// add a new employee
// delete a employee

userRoutes.delete("/deleteEmplyoee/:id", checkChef, deleteEmployeeHandler);

// edit employee
// // change employee permissoins

userRoutes.put("/editAbsenceData", checkChef, editAbsenceData);

userRoutes.delete(
    "/deleteDescriptionData/:id",
    checkChef,
    deleteDescriptionHandler,
);
userRoutes.get("/fetchTaskData", checkChef, fetchDescriptionHandler);

// get part description data
userRoutes.get("/rawdescription", checkChef, fetchDescriptionHandler);

// edit the root description data
userRoutes.put("/editTaskData/:id", checkChef, editDescriptionHandler);

// create a new description data

userRoutes.post("/createTaskData", checkChef, createDescriptionHandler);
// file paths for employee

export default userRoutes;
