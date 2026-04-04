import {
    deleteEmplyoee,
    editAbsenceData,
    getEmployee,
    getEmployeeById,
    getEmployeeWorkerData,
} from "@/controllers/employee.controller";
import express from "express";
import * as EmployeeV2 from "../controllers/employee.controllerV2";

const employeeRoutes = express.Router();

// prefix /employee

employeeRoutes.get("/getEmployeeWorkerData", getEmployeeWorkerData);
employeeRoutes.get(
    "/v2/getEmployeeWorkerData",

    EmployeeV2.getEmployeeWorkerData,
);

employeeRoutes.get("/specificEmployeeData", getEmployee);
employeeRoutes.get("/v2/specificEmployeeData", EmployeeV2.getEmployee);
employeeRoutes.get("/getEmployeeById/:id", getEmployeeById);
employeeRoutes.get(
    "/v2/getEmployeeById/:id",

    EmployeeV2.getEmployeeById,
);
employeeRoutes.delete("/deleteEmplyoee/:id", deleteEmplyoee);
employeeRoutes.delete(
    "/v2/deleteEmplyoee/:id",

    EmployeeV2.deleteEmployee,
);
employeeRoutes.put("/editAbsenceData", editAbsenceData);
employeeRoutes.put(
    "/v2/editAbsenceData",

    EmployeeV2.editAbsenceData,
);

export { employeeRoutes };
