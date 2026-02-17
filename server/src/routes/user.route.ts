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
    getUnifiedData,
    getUserHandler,
} from "../controllers/user.controller";

const userRoutes = Router();

// prefix /user

userRoutes.get("/", getUserHandler);
userRoutes.get("/chefpermission", getChefHandler);

// employee data

// fetch employee tasks
userRoutes.get("/employeeData", getUnifiedData);

// get EmployeeData
userRoutes.get("/specificEmployeeData", getEmployeedata);

// add a new employee
// delete a employee

userRoutes.delete("/deleteEmplyoee/:id", deleteEmployeeHandler);

// edit employee
// // change employee permissoins

userRoutes.put("/editAbsenceData", editAbsenceData);

// deletes the description data

userRoutes.delete("/deleteDescriptionData", deleteDescriptionHandler);

// fetch the root description data

userRoutes.get("/fetchTaskData", fetchDescriptionHandler);

// get part description data

userRoutes.get("/rawdescription", fetchDescriptionHandler);

// edit the root description data

userRoutes.put("/editTaskData", editDescriptionHandler);

// create a new description data

userRoutes.post("/createTaskData", createDescriptionHandler);

// file paths for employee

export default userRoutes;
