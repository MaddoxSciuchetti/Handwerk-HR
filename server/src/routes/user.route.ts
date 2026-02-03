import { Router } from "express";
import {
  getChefHandler,
  getEmployeedata,
  getUserHandler,
} from "../controllers/user.controller";

const userRoutes = Router();

// prefix /user

userRoutes.get("/", getUserHandler);
userRoutes.get("/chefpermission", getChefHandler);
userRoutes.get("/employeeData", getEmployeedata);

export default userRoutes;
