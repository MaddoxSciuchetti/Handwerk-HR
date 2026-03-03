import { prisma } from "@/lib/prisma";
import { AbsenceData } from "@/types/employee.types";
import { parseGermanDate } from "@/utils/dateParser";
import resolveOwner from "@/utils/resolverOwner";

export const queryEmployeeWorkerData = async () => {
    const onboarding_forms = await prisma.form_fields.findMany({
        select: {
            form_field_id: true,
            description: true,
            owner: true,
            auth_user: {
                select: {
                    id: true,
                    vorname: true,
                    nachname: true,
                    employeeStatus: {
                        where: {
                            absenceEnd: { gte: new Date() },
                        },
                        orderBy: { absenceEnd: "desc" },
                        take: 1,
                        select: {
                            absence: true,
                            absencebegin: true,
                            absenceEnd: true,
                            absencetype: true,
                            substitute: true,
                            sub_user: {
                                select: {
                                    id: true,
                                    vorname: true,
                                    nachname: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            form_field_id: "asc",
        },
    });

    const employee_forms = await prisma.form_inputs.findMany({
        select: {
            id: true,
            employee_form_id: true,
            form_field_id: true,
            status: true,
            timestamp: true,
            employee_forms: {
                select: {
                    user_id: true,
                    users: {
                        select: {
                            id: true,
                            vorname: true,
                            nachname: true,
                            email: true,
                        },
                    },
                },
            },
            HistoryFormData: {
                select: {
                    timestamp: true,
                },
                orderBy: {
                    timestamp: "desc",
                },
                take: 1,
            },
        },
    });

    const unifiedData = onboarding_forms.map((form_field) => {
        const resolved = resolveOwner(form_field.auth_user);
        return {
            form_field_id: form_field.form_field_id,
            description: form_field.description,
            owner: form_field.auth_user.id,
            auth_id: form_field.auth_user.id,
            fullname: resolved.vorname + " " + resolved.nachname,
            substitute_name: resolved.isSubstitute
                ? resolved.vorname + " " + resolved.nachname
                : null,
            is_substitute: resolved.isSubstitute,
            original_owner:
                form_field.auth_user.vorname +
                " " +
                form_field.auth_user.nachname,
            substitute_id: resolved.isSubstitute ? resolved.id : null,
            inputs: employee_forms
                .filter(
                    (input) => input.form_field_id === form_field.form_field_id,
                )
                .map((input) => ({
                    id: input.id,
                    employee_form_id: input.employee_form_id,
                    form_field_id: input.form_field_id,
                    status: input.status,
                    timestamp: input.timestamp,
                    timeStampLastChange:
                        input.HistoryFormData[0]?.timestamp || input.timestamp,
                    employee: input.employee_forms.users,
                })),
        };
    });

    return { unifiedData };
};

export const queryEmployee = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            vorname: true,
            nachname: true,
            email: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
            user_permission: true,
            employeeStatus: {
                select: {
                    id: true,
                    absence: true,
                    absencetype: true,
                    absencebegin: true,
                    absenceEnd: true,
                    substitute: true,
                    sub_user: {
                        select: {
                            id: true,
                            vorname: true,
                            nachname: true,
                        },
                    },
                },
            },
        },
    });
};

export const removeEmployee = async (id: string, chefId: string) => {
    return await prisma.$transaction([
        prisma.form_fields.updateMany({
            where: {
                owner: id,
            },
            data: {
                owner: chefId,
            },
        }),

        prisma.historyFormData.updateMany({
            where: { changed_by: id },
            data: { changed_by: chefId },
        }),
        prisma.user.delete({
            where: { id },
        }),
    ]);
};

export const updateAbsenceData = async (data: AbsenceData) => {
    return await prisma.employeeStatus.upsert({
        where: {
            userId: data.id,
        },
        update: {
            absence: data.absence,
            absencetype: data.absencetype,
            absencebegin: parseGermanDate(data.absencebegin),
            absenceEnd: parseGermanDate(data.absenceEnd),
            substitute: data.substitute,
        },
        create: {
            userId: data.id,
            absence: data.absence,
            absencetype: data.absencetype,
            absencebegin: parseGermanDate(data.absencebegin),
            absenceEnd: parseGermanDate(data.absenceEnd),
            substitute: data.substitute,
        },
    });
};
