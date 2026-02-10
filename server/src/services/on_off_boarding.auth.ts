import { prisma } from "@/lib/prisma";
import { datevalidation } from "@/src/utils/datevalidation";
import { HistorySchemaType } from "../controllers/on_off_boarding.controller";
import { sendMail } from "../utils/sendMail";
import appAssert from "../utils/appAssert";
import { INTERNAL_SERVER_ERROR } from "../constants/http";
import { getFormReminderTemplate } from "../utils/emailTemplates";

type dataObject = {
    type: string;
    vorname: string;
    nachname: string;
    email: string;
    geburtsdatum: string;
    adresse: string;
    eintrittsdatum: string;
    position: string;
};

const FORM_INPUTS_ONBOARDING = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
] as const;

const FORM_INPUTS_OFFBOARDING = [
    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
] as const;

type returnObject = {
    user: {
        id: number;
        vorname: string;
        nachname: string;
    };
    employee_form: number;
};

export const createUser = (data: dataObject): Promise<returnObject> => {
    return prisma.$transaction(async (tx: any) => {
        const user = await tx.users.create({
            data: {
                vorname: data.vorname,
                nachname: data.nachname,
                email: data.email,
                geburtsdatum: datevalidation(data.geburtsdatum),
                adresse: data.adresse,
                eintrittsdatum: datevalidation(data.eintrittsdatum),
                position: data.position,
            },
            select: {
                id: true,
                vorname: true,
                nachname: true,
            },
        });

        const employee_forms_table = await tx.employee_forms.create({
            data: {
                user_id: user.id,
                form_type: data.type,
            },
            select: {
                id: true,
                form_type: true,
            },
        });

        await tx.form_inputs.createMany({
            data:
                employee_forms_table.form_type === "Offboarding"
                    ? FORM_INPUTS_OFFBOARDING.map((field_id) => ({
                          employee_form_id: employee_forms_table.id,
                          form_field_id: field_id,
                      }))
                    : FORM_INPUTS_ONBOARDING.map((field_id) => ({
                          employee_form_id: employee_forms_table.id,
                          form_field_id: field_id,
                      })),
        });

        return {
            user,
            employee_form: employee_forms_table.id,
        };
    });
};

export const fetchUser = async () => {
    const user_information = await prisma.users.findMany({
        where: {
            employee_forms: {
                some: {
                    form_type: { in: ["Onboarding", "Offboarding"] },
                },
            },
        },
        select: {
            id: true,
            vorname: true,
            nachname: true,
            employee_forms: {
                select: {
                    form_type: true,
                    id: true,
                },
            },
        },
    });

    user_information.forEach((user) => {
        console.log(user.employee_forms);
    });

    return {
        user_information,
    };
};

export const deleteUser = async (data: number) => {
    const delete_user = await prisma.users.delete({
        where: {
            id: data,
        },
    });

    return delete_user;
};

export const getUserFormData = async (id: any) => {
    return await prisma.users.findUnique({
        where: {
            id: id,
        },
        select: {
            id: true,
            vorname: true,
            nachname: true,
            employee_forms: {
                select: {
                    id: true,
                    form_type: true,
                    form_inputs: {
                        orderBy: {
                            form_field_id: "asc",
                        },
                        select: {
                            id: true,
                            form_field_id: true,
                            status: true,
                            edit: true,
                            form_fields: {
                                select: {
                                    description: true,
                                    owner: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
};

type Data = {
    id: number;
    editcomment: string;
    select_option: string;
};

export const editdata = async (data: Data) => {
    return await prisma.form_inputs.update({
        where: {
            id: data.id,
        },
        data: {
            status: data.select_option,
            edit: data.editcomment,
        },
    });
};

type historySchemaget = {
    id: number;
};

type historySchema = {
    editcomment: string;
    select_option: string;
};

export const insertHistoryData = async (data: HistorySchemaType) => {
    return await prisma.historyFormData.createMany({
        data: {
            status: data.result.select_option,
            edit: data.result.editcomment,
            form_input_id: data.result.id,
            changed_by: data.user.id,
        },
    });
};

export const getHistoryData = async (data: number) => {
    return await prisma.historyFormData.findMany({
        where: {
            form_input_id: data,
        },
        include: {
            auth_user: {
                select: {
                    id: true,
                    email: true,
                    verified: true,
                },
            },
        },
        orderBy: {
            timestamp: "desc",
        },
    });
};

export const insertFileData = async (fileData: {
    userId: number;
    original_filename: string;
    file_size: number;
    content_type: string;
    cloud_url: string;
    cloud_key: string;
}) => {
    try {
        const employeeForm = await prisma.employee_forms.findFirst({
            where: {
                user_id: fileData.userId,
            },
        });

        if (!employeeForm) {
            throw new Error(
                `No employee form found for user ${fileData.userId}`,
            );
        }

        const savedfile = await prisma.workerFiles.create({
            data: {
                employee_form_id: employeeForm.id,
                original_filename: fileData.original_filename,
                file_size: fileData.file_size,
                content_type: fileData.content_type,
                cloud_url: fileData.cloud_url,
                cloud_key: fileData.cloud_key,
            },
        });
        return savedfile;
    } catch (error) {
        console.log("error with filedata insert", error);
        throw error;
    }
};

export const fetchFileData = async (userId: number) => {
    const files = await prisma.workerFiles.findMany({
        where: {
            employee_forms: {
                user_id: userId,
            },
        },
        include: {
            employee_forms: {
                include: {
                    users: true,
                },
            },
        },
    });
    return files;
};

export const deleteFiles = async (id: number) => {
    const existingFile = await prisma.workerFiles.findUnique({
        where: { id },
    });
    if (!existingFile) {
        throw new Error(`File with id ${id} not found`);
    }
    return await prisma.workerFiles.delete({
        where: { id },
    });
};

export const sendEmployeeEmail = async (email: string) => {
    const { data, error } = await sendMail({
        to: email,
        ...getFormReminderTemplate(),
    });
    appAssert(
        data?.id,
        INTERNAL_SERVER_ERROR,
        `${error?.name} - ${error?.message}`,
    );

    return {
        emailId: data.id,
    };
};
