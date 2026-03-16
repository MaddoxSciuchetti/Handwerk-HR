import { prisma } from "@/lib/prisma";
import { InsertWorkerHistory } from "@/schemas/worker.schemas";
import {
    InsertWorker,
    InsertWorkerResponse,
    WorkerForm,
} from "@/types/worker.types";
import { datevalidation } from "@/utils/datevalidation";

export type WorkerListMode = "active" | "archived";

export const insertWorker = (
    data: InsertWorker,
): Promise<InsertWorkerResponse> => {
    return prisma.$transaction(async (tx: any) => {
        const worker = await tx.users.create({
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
                user_id: worker.id,
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
            worker,
            employee_form: employee_forms_table.id,
        };
    });
};

export const queryWorkerData = async (mode: WorkerListMode = "active") => {
    const worker = await prisma.users.findMany({
        where: {
            archivedAt: mode === "archived" ? { not: null } : null,
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
            archivedAt: true,
            archivedBy: true,
            archivedByUser: {
                select: {
                    vorname: true,
                    nachname: true,
                },
            },
            employee_forms: {
                select: {
                    form_type: true,
                    id: true,
                },
            },
        },
    });
    return {
        worker: worker.map((item) => ({
            ...item,
            archivedByName: item.archivedByUser
                ? `${item.archivedByUser.vorname} ${item.archivedByUser.nachname}`
                : null,
        })),
    };
};

export const removeWorker = async (data: number) => {
    const worker = await prisma.users.delete({
        where: {
            id: data,
        },
    });

    return worker;
};

export const archiveWorker = async (workerId: number, archivedBy: string) => {
    return await prisma.users.update({
        where: { id: workerId },
        data: {
            archivedAt: new Date(),
            archivedBy,
        },
        select: {
            id: true,
            vorname: true,
            nachname: true,
            archivedAt: true,
            archivedBy: true,
        },
    });
};

export const unarchiveWorker = async (workerId: number) => {
    return await prisma.users.update({
        where: { id: workerId },
        data: {
            archivedAt: null,
            archivedBy: null,
        },
        select: {
            id: true,
            vorname: true,
            nachname: true,
            archivedAt: true,
            archivedBy: true,
        },
    });
};

export const queryWorkerById = async (id: any) => {
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

export const modifyWorker = async (data: WorkerForm) => {
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

export const queryWorkerHistory = async (data: number) => {
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
                    cloud_url: true,
                },
            },
        },
        orderBy: {
            timestamp: "desc",
        },
    });
};

export const insertWorkerHistory = async (data: InsertWorkerHistory) => {
    return await prisma.historyFormData.createMany({
        data: {
            status: data.result.select_option,
            edit: data.result.editcomment,
            form_input_id: data.result.id,
            changed_by: data.user.id,
        },
    });
};

export const insertWorkerFile = async (fileData: {
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

export const queryWorkerFiles = async (userId: number) => {
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

export const removeWorkerFile = async (id: number) => {
    const existingFile = await prisma.workerFiles.findUnique({
        where: { id },
    });
    if (!existingFile) {
        throw new Error(`File with id ${id} not found`);
    }
    return await prisma.workerFiles.deleteMany({
        where: { id },
    });
};
