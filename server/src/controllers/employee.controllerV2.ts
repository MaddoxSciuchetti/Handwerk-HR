import { NOT_FOUND, OK } from "@/constants/http";
import {
    computeIsAbsent,
    queryEmployee,
    queryEmployeeById,
    queryEmployeeWorkerData,
    removeEmployee,
    updateAbsenceData,
} from "@/services/employee.serviceV2";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

export const getEmployeeWorkerData = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const data = await queryEmployeeWorkerData(orgId);

    const result = data.map((engagement) => ({
        ...engagement,
        responsibleUser: {
            ...engagement.responsibleUser,
            isAbsent: computeIsAbsent(engagement.responsibleUser.absences),
        },
    }));

    return res.status(OK).json(result);
});

export const getEmployee = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const employees = await queryEmployee(orgId);

    const result = employees.map((emp) => ({
        ...emp,
        isAbsent: computeIsAbsent(emp.absences),
    }));

    return res.status(OK).json(result);
});

export const getEmployeeById = catchErrors(async (req, res) => {
    const id = req.params.id as string;
    const orgId = req.orgId;
    console.log("did this work");

    const employee = await queryEmployeeById(id, orgId);
    appAssert(employee, NOT_FOUND, "Employee not found");

    return res.status(OK).json({
        ...employee,
        isAbsent: computeIsAbsent(employee.absences),
    });
});

export const deleteEmployee = catchErrors(async (req, res) => {
    const id = req.params.id as string;
    const orgId = req.orgId;

    await removeEmployee(id, orgId);

    return res.status(OK).json({ message: "Employee removed successfully" });
});

export const editAbsenceData = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const { userId, absenceType, startDate, endDate, substituteId } = req.body;

    const result = await updateAbsenceData({
        userId,
        orgId,
        absenceType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        substituteId,
    });

    return res.status(OK).json(result);
});
