import { prisma } from "@/lib/prisma";

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
  console.log("GET EMPLOYEES");
  console.log(onboarding_forms);

  const employee_forms = await prisma.form_inputs.findMany({
    select: {
      id: true,
      employee_form_id: true,
      form_field_id: true,
      timestamp: true,
    },
  });

  console.log(employee_forms);

  const unifiedData = onboarding_forms.map((form_field) => ({
    form_field_id: form_field.form_field_id,
    description: form_field.description,
    owner: form_field.owner,
    inputs: employee_forms.filter(
      (input) => input.form_field_id === form_field.form_field_id,
    ),
  }));

  return { unifiedData };
};
