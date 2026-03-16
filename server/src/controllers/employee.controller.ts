import { OK } from "@/constants/http";
import {
    queryEmployee,
    queryEmployeeWorkerData,
    removeEmployee,
    updateAbsenceData,
} from "@/services/employee.service";
import catchErrors from "@/utils/catchErrors";

export const getEmployeeWorkerData = catchErrors(async (req, res) => {
    const { unifiedData } = await queryEmployeeWorkerData();
    return res.status(OK).json(unifiedData);
});

export const getEmployee = catchErrors(async (req, res) => {
    const EmployeeData = await queryEmployee();
    console.log(EmployeeData);
    return res.status(OK).json(EmployeeData);
});

export const deleteEmplyoee = catchErrors(async (req, res) => {
    const id = req.params.id as string;
    const chefId = req.userId;
    console.log(id);

    const deleteEmployeeResult = await removeEmployee(id, chefId);

    return res.status(OK).json(deleteEmployeeResult);
});

export const editAbsenceData = catchErrors(async (req, res) => {
    const data = req.body;

    const editAbsenceResult = await updateAbsenceData(data);
    return res.status(OK).json(editAbsenceResult);
});
