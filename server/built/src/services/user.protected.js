import { prisma } from "@/lib/prisma";
export const getUser = async (id) => {
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
export const getChef = async (id) => {
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
        where: {
            owner: {
                in: ["Janik", "Siemon", "Acosta", "Sen", "Conpro IT"],
            },
        },
        select: {
            form_field_id: true,
            description: true,
            owner: true,
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
    const individual_worker = await prisma.users.findMany({});
    const unifiedData = onboarding_forms.map((form_field) => ({
        form_field_id: form_field.form_field_id,
        description: form_field.description,
        owner: form_field.owner,
        inputs: employee_forms
            .filter((input) => input.form_field_id === form_field.form_field_id)
            .map((input) => ({
            id: input.id,
            employee_form_id: input.employee_form_id,
            form_field_id: input.form_field_id,
            status: input.status,
            timestamp: input.timestamp,
            employee: input.employee_forms.users,
        })),
    }));
    console.log("UNIFIED DATA");
    console.log(JSON.stringify(unifiedData, null, 2));
    console.log(unifiedData);
    return { unifiedData };
};
