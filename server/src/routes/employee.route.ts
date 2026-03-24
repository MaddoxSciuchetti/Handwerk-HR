import {
    deleteEmplyoee,
    editAbsenceData,
    getEmployee,
    getEmployeeById,
    getEmployeeWorkerData,
} from "@/controllers/employee.controller";
import { checkChef } from "@/utils/checkChef";
import express from "express";

const employeeRoutes = express.Router();

// prefix /employee

employeeRoutes.get("/getEmployeeWorkerData", checkChef, getEmployeeWorkerData);
employeeRoutes.get("/specificEmployeeData", checkChef, getEmployee);
employeeRoutes.get("/getEmployeeById/:id", checkChef, getEmployeeById);
employeeRoutes.delete("/deleteEmplyoee/:id", checkChef, deleteEmplyoee);
employeeRoutes.put("/editAbsenceData", checkChef, editAbsenceData);

export { employeeRoutes };
