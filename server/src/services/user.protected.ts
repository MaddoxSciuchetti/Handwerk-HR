import { prisma } from "@/lib/prisma";
import resolveOwner from "@/utils/resolverOwner";
import { id } from "zod/v4/locales";

export const getUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: id,
        },
        omit: {
            password: true,
        },
    });

    return user;
};

export const getChef = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: id,
        },
        omit: {
            password: true,
        },
    });

    return user;
};

export const getemployee_form = async () => {
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
                    employee: input.employee_forms.users,
                })),
        };
    });

    console.log("UNIFIED DATA");
    console.log(JSON.stringify(unifiedData, null, 2));
    console.log(unifiedData);

    return { unifiedData };
};

export const getDescriptionData = async () => {
    const descriptiondata = await prisma.form_fields.findMany({
        select: {
            form_field_id: true,
            description: true,
            owner: true,
            template_type: true,
            auth_user: {
                select: {
                    id: true,
                    vorname: true,
                    nachname: true,
                },
            },
        },
    });

    return descriptiondata;
};

export const updateDescriptionData = async (
    form_field_id: number,
    owner: string,
    description: string,
) => {
    const updatedDescription = await prisma.form_fields.update({
        where: {
            form_field_id: form_field_id,
        },
        data: {
            owner: owner,
            description: description,
        },
    });

    return updatedDescription;
};

export const deleteDescriptionData = async (id: number) => {
    const deleteData = await prisma.form_fields.delete({
        where: {
            form_field_id: id,
        },
    });

    return deleteData;
};

export const createDescription = async (
    description: string,
    owner: string,
    template_type: "ONBOARDING" | "OFFBOARDING",
) => {
    const newDescription = await prisma.form_fields.create({
        data: {
            description: description,
            owner: owner,
            template_type: template_type,
        },
    });
    return newDescription;
};

export const queryEmployeeData = async () => {
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

export const deleteEmployee = async (id: string, chefId: string) => {
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

type AbsenceData = {
    id: string;
    absence: string;
    absencetype: string;
    absencebegin: Date;
    absenceEnd: Date;
    substitute: string;
};
export const updateAbsenceData = async (data: AbsenceData) => {
    return await prisma.employeeStatus.upsert({
        where: {
            userId: data.id,
        },
        update: {
            absence: data.absence,
            absencetype: data.absencetype,
            absencebegin: new Date(data.absencebegin),
            absenceEnd: new Date(data.absenceEnd),
            substitute: data.substitute,
        },
        create: {
            userId: data.id,
            absence: data.absence,
            absencetype: data.absencetype,
            absencebegin: new Date(data.absencebegin),
            absenceEnd: new Date(data.absenceEnd),
            substitute: data.substitute,
        },
    });
};
