import { Router } from "express";
import {
    createDescriptionHandler,
    deleteDescriptionHandler,
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
// edit employee
// // change employee permissoins

// deletes the description data

userRoutes.delete("/deleteDescriptionData", deleteDescriptionHandler);

// fetch the root description data

userRoutes.get("/fetchTaskData", fetchDescriptionHandler);

// edit the root description data

userRoutes.put("/editTaskData", editDescriptionHandler);

// create a new description data

userRoutes.post("/createTaskData", createDescriptionHandler);

// file paths for employee

export default userRoutes;
