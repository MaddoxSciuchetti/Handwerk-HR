import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "@/lib/api";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { ErrorMessage } from "@hookform/error-message";
const CreateWorkerSchema = z
    .object({
        firstName: z.string().min(3, { message: "Vorname ist erforderlich" }),
        lastName: z.string().min(3, { message: "Nachname ist erforderlich" }),
        email: z
            .string()
            .min(3, { message: "Bitte gebe eine email an" })
            .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
                message: "Die Email ist falsch",
            }),
        password: z.string().min(6, { message: "Bitte gebe ein Passwort ein" }),
        confirmPassword: z
            .string()
            .min(6, { message: "Bitte gebe ein Passwort ein" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
    });

type TWorkerSchema = z.infer<typeof CreateWorkerSchema>;

function ModalMitarbeiter({ toggleModal }: { toggleModal: () => void }) {
    const queryClient = useQueryClient();

    const createEmployee = useMutation({
        mutationFn: signup,
        onSuccess: () => {
            (toggleModal(),
                queryClient.invalidateQueries({
                    queryKey: ["EmployeeDataSpecifics"],
                }));
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TWorkerSchema>({
        resolver: zodResolver(CreateWorkerSchema),
        criteriaMode: "all",
    });

    const onFormSubmit: SubmitHandler<TWorkerSchema> = (
        data: TWorkerSchema,
    ) => {
        createEmployee.mutate(data);
        console.log("formdata test", data);
    };

    const CreateMitarbeiterInputs = [
        {
            name: "firstName" as const,
            placeholder: "Vorname",
            type: "text",
            required: true,
        },
        {
            name: "lastName" as const,
            placeholder: "Nachname",
            type: "text",
            required: true,
        },
        {
            name: "email" as const,
            placeholder: "email",
            type: "email",
            required: true,
        },
        {
            name: "password" as const,
            placeholder: "password",
            type: "password",
            required: true,
        },
        {
            name: "confirmPassword" as const,
            placeholder: "Confirm Password",
            type: "password",
            required: true,
        },
    ];

    return (
        <>
            <div className="flex flex-col max-h-100 min-h-120 mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-xl">
                <div className="flex flex-col max-w-xl h-full w-xl  my-10">
                    <div className="flex mx-auto flex-col space-y-4 w-80 ">
                        <p className="mb-5">
                            Ein Mitarbeiter erhält eine E-Mail mit der Bitte,
                            sich einzuloggen.
                        </p>
                        <form
                            onSubmit={handleSubmit(onFormSubmit)}
                            className="flex flex-col gap-5 w-full"
                        >
                            {CreateMitarbeiterInputs.map((value, index) => (
                                <div key={index}>
                                    <Input
                                        type={value.type}
                                        placeholder={value.placeholder}
                                        {...register(value.name, {
                                            required: value.required,
                                        })}
                                    />

                                    <ErrorMessage
                                        errors={errors}
                                        name={value.name}
                                        render={({ message }) => (
                                            <p>{message}</p>
                                        )}
                                    />
                                </div>
                            ))}
                            <Button
                                className="w-full my-2 cursor-pointer "
                                variant={"outline"}
                                type="submit"
                            >
                                Nutzer Erstellen
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ModalMitarbeiter;
