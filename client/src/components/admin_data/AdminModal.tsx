import z from "zod";
import { Button } from "../ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { sendReminderWorker } from "@/lib/api";

type TCloseModal = {
  onClose?: () => void;
};

const formSchema = z.object({
  email: z.email(),
  subject: z.string(),
  test: z.string(),
});

export type sendEmailSchema = z.infer<typeof formSchema>;

function AdminModal({ onClose }: TCloseModal) {
  const {
    mutate: sendReminder,
    isError,
    isSuccess,
  } = useMutation<unknown, Error, sendEmailSchema>({
    mutationKey: ["employee_email"],
    mutationFn: (data: sendEmailSchema) => sendReminderWorker(data),
  });

  const onSubmit: SubmitHandler<sendEmailSchema> = (data) => sendReminder(data);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<sendEmailSchema>({ resolver: zodResolver(formSchema) });

  return (
    <>
      {/* <div
        onClick={onClose}
        className="h-screen inset-0 fixed z-40 bg-black/60"
      ></div> */}

      <div className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl w-2xl">
        <div className="flex items-center gap-10 justify-center mb-6 m-10 ">
          <form
            className="flex flex-col w-md outline justify-center "
            onSubmit={handleSubmit(onSubmit)}
          >
            <input placeholder="email" {...register("email")} />
            {errors.email && <span>{errors.email.message}</span>}
            <input placeholder="subject" {...register("subject")} />
            <textarea
              placeholder="schreibe hier"
              {...register("test")}
            ></textarea>

            {isSuccess && (
              <div className="text-green-600">
                <p>Email gesendet</p>
              </div>
            )}

            {isError && <div>Etwas ist schief gelaufen</div>}

            {isSuccess ? (
              <Button className="outline" onClick={onClose}>
                Schliessen
              </Button>
            ) : (
              <Button type="submit" className="">
                Send email
              </Button>
            )}
          </form>
        </div>
        <p>Email Vorlage</p>
      </div>
    </>
  );
}

export default AdminModal;
