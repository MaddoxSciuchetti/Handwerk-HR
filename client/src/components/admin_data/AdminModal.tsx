import z from "zod";
import { Button } from "../ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { sendReminderWorker } from "@/lib/api";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";

type TCloseModal = {
    onClose?: () => void;
    selectedUser?: string | null;
};

const formSchema = z.object({
    email: z.email(),
    subject: z.string(),
    test: z.string(),
});

export type sendEmailSchema = z.infer<typeof formSchema>;

function AdminModal({ onClose, selectedUser }: TCloseModal) {
    const {
        mutate: sendReminder,
        isError,
        isSuccess,
    } = useMutation<unknown, Error, sendEmailSchema>({
        mutationKey: ["employee_email"],
        mutationFn: (data: sendEmailSchema) => sendReminderWorker(data),
    });

    const onSubmit: SubmitHandler<sendEmailSchema> = (data) =>
        sendReminder(data);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<sendEmailSchema>({ resolver: zodResolver(formSchema) });

    return (
        <>
            <div className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl w-2xl">
                <div className="flex items-center gap-10 justify-center mb-6 m-10 ">
                    <form
                        className="flex flex-col gap-5 w-md justify-center "
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <p>Schicke eine Errinnerung</p>
                        <Input placeholder="Email" {...register("email")} />
                        {errors.email && <span>{errors.email.message}</span>}
                        <Input placeholder="Betreff" {...register("subject")} />
                        <Textarea
                            placeholder={`Nachricht an ${selectedUser}`}
                            {...register("test")}
                        ></Textarea>

                        {isSuccess && (
                            <div className="text-green-600">
                                <p>Email gesendet</p>
                            </div>
                        )}

                        {isError && <div>Etwas ist schief gelaufen</div>}

                        <Button
                            type={isSuccess ? "button" : "submit"}
                            variant={"outline"}
                            onClick={isSuccess ? onClose : undefined}
                            className=""
                        >
                            {isSuccess ? (
                                <span className="text-green-700">
                                    Schliessen
                                </span>
                            ) : (
                                <span>Senden</span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default AdminModal;
