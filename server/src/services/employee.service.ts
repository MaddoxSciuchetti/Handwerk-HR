import { prisma } from "@/lib/prisma";
import { AbsenceData } from "@/types/employee.types";
import { parseGermanDate } from "@/utils/dateParser";
import resolveOwner from "@/utils/resolverOwner";

export const queryEmployeeWorkerData = async () => {
    const form_fields = await prisma.form_fields.findMany({
        select: {
            form_field_id: true,
            description: true,
            auth_user: {
                select: {
                    id: true,
                    vorname: true,
                    nachname: true,
                    employeeStatus: {
                        where: { absenceEnd: { gte: new Date() } },
                        orderBy: { absenceEnd: "desc" },
                        take: 1,
                        select: {
                            absencebegin: true,
                            absenceEnd: true,
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
        orderBy: { form_field_id: "asc" },
    });

    const form_inputs = await prisma.form_inputs.findMany({
        select: {
            id: true,
            form_field_id: true,
            status: true,
            timestamp: true,
            employee_forms: {
                select: {
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
                select: { timestamp: true },
                orderBy: { timestamp: "desc" },
                take: 1,
            },
        },
    });

    return form_fields.map((field) => {
        const resolved = resolveOwner(field.auth_user);
        return {
            form_field_id: field.form_field_id,
            description: field.description,
            owner: field.auth_user.id,
            ownerName: `${field.auth_user.vorname} ${field.auth_user.nachname}`,
            isSubstitute: resolved.isSubstitute,
            substituteName: resolved.isSubstitute
                ? `${resolved.vorname} ${resolved.nachname}`
                : null,
            inputs: form_inputs
                .filter((input) => input.form_field_id === field.form_field_id)
                .map((input) => ({
                    id: input.id,
                    status: input.status,
                    timestamp: input.timestamp,
                    lastChangedAt:
                        input.HistoryFormData[0]?.timestamp ?? input.timestamp,
                    employee: input.employee_forms.users,
                })),
        };
    });
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

export const queryEmployeeById = async (id: string) => {
    return await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            vorname: true,
            nachname: true,
            email: true,
            verified: true,
            user_permission: true,
            createdAt: true,
            employeeStatus: {
                take: 1,
                select: {
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
