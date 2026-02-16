import { Router } from "express";
import {
    createDescriptionHandler,
    deleteDescriptionHandler,
    editDescriptionHandler,
    fetchDescriptionHandler,
    getChefHandler,
    getEmployeedata,
    getUserHandler,
} from "../controllers/user.controller";

const userRoutes = Router();

// prefix /user

userRoutes.get("/", getUserHandler);
userRoutes.get("/chefpermission", getChefHandler);
userRoutes.get("/employeeData", getEmployeedata);

// deletes the description data

userRoutes.delete("/deleteDescriptionData", deleteDescriptionHandler);

// fetch the root description data

userRoutes.get("/fetchTaskData", fetchDescriptionHandler);

// edit the root description data

userRoutes.put("/editTaskData", editDescriptionHandler);

// create a new description data

userRoutes.post("/createTaskData", createDescriptionHandler);

export default userRoutes;
