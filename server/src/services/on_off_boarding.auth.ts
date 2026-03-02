import { prisma } from "@/lib/prisma";
import { datevalidation } from "@/utils/datevalidation";
import { INTERNAL_SERVER_ERROR } from "../constants/http";
import { HistorySchemaType } from "../controllers/on_off_boarding.controller";
import appAssert from "../utils/appAssert";
import { getFormReminderTemplate } from "../utils/emailTemplates";
import { sendMail } from "../utils/sendMail";

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

        const templateType =
            employee_forms_table.form_type === "Offboarding"
                ? "OFFBOARDING"
                : "ONBOARDING";

        const formFields = await tx.form_fields.findMany({
            where: { template_type: templateType },
            select: { form_field_id: true },
        });

        await tx.form_inputs.createMany({
            data: formFields.map((field: { form_field_id: number }) => ({
                employee_form_id: employee_forms_table.id,
                form_field_id: field.form_field_id,
            })),
        });

        return {
            user,
            employee_form: employee_forms_table.id,
        };
    });
};

export const addExtraFormFieldDB = async (data: {
    description: string;
    template_type: "ONBOARDING" | "OFFBOARDING";
    owner: string;
}) => {
    return prisma.$transaction(async (tx) => {
        const newField = await tx.form_fields.create({
            data: {
                description: data.description,
                template_type: data.template_type,
                owner: data.owner,
            },
        });
        const formType =
            data.template_type === "OFFBOARDING" ? "Offboarding" : "Onboarding";

        const existingForms = await tx.employee_forms.findMany({
            where: { form_type: formType },
            select: { id: true },
        });
        if (existingForms.length > 0) {
            await tx.form_inputs.createMany({
                data: existingForms.map((form) => ({
                    employee_form_id: form.id,
                    form_field_id: newField.form_field_id,
                })),
            });
        }

        return newField;
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
                                    auth_user: {
                                        select: {
                                            id: true,
                                            vorname: true,
                                            nachname: true,
                                            employeeStatus: {
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
                                    },
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
    console.log("DIRECT ACCESS TO DATABASE FILES");
    console.log(files);
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
