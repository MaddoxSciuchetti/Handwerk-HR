import { prisma } from "@/lib/prisma";

export const removeTemplateTask = async (id: number) => {
    const deleteData = await prisma.form_fields.delete({
        where: {
            form_field_id: id,
        },
    });

    return deleteData;
};

export const queryTask = async () => {
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

export const insertTemplateTask = async (data: {
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

export const modifyTemplateTask = async (
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
