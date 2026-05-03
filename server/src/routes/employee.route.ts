import express from "express";
import * as EmployeeV2 from "../controllers/employee.controller";

const employeeRoutes = express.Router();

employeeRoutes.get(
    "/v2/getEmployeeWorkerData",

    EmployeeV2.getEmployeeWorkerData,
);

employeeRoutes.get("/v2/specificEmployeeData", EmployeeV2.getEmployee);
employeeRoutes.get(
    "/v2/getEmployeeById/:id",

    EmployeeV2.getEmployeeById,
);
employeeRoutes.delete(
    "/v2/deleteEmplyoee/:id",

    EmployeeV2.deleteEmployee,
);
employeeRoutes.put("/v2/editAbsenceData", EmployeeV2.editAbsenceData);

export { employeeRoutes };
