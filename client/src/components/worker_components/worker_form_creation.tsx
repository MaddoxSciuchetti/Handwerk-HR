import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { ErrorMessage } from "@hookform/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInputs, formSchema } from "@/schemas/zodSchema";

interface WorkerDataFormProps {
  type: "Onboarding" | "Offboarding";
  success: (data: FormInputs) => void;
}

export const WorkerDataForm = ({ type, success }: WorkerDataFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: type,
    },
    criteriaMode: "all",
  });

  const onFormSubmit = (data: FormInputs) => {
    console.log("formdata test", data);
    success(data);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex flex-col max-w-2xl justify-center gap-6 mx-auto"
      >
        <div className="flex flex-row gap-6 mx-auto">
          <div className="flex flex-col gap-4 items-center focus:outline-none">
            {/* this should always be shown */}
            <label>Vorname</label>
            <input
              className="w-64 p-2 border-gray-300 border-2 rounded-xl"
              type="text"
              placeholder="Vorname"
              {...register("vorname", { required: "erforderlich" })}
            />
            <ErrorMessage errors={errors} name="Vorname" />
            {/* {errors.Vorname && errors.Vorname.types && (
              <p>{errors.Vorname.types.required}</p>
            )} */}
            <label>Nachname</label>
            <input
              className="w-64 p-2 border-gray-300 border-2 rounded-xl focus:border-gray-600 outline-none"
              type="text"
              placeholder="Nachname"
              {...register("nachname")}
            />
            <ErrorMessage errors={errors} name="Nachname" />

            <label>Email</label>
            <input
              className="w-64 p-2 border-gray-300 border-2 rounded-xl outline-none"
              type="text"
              placeholder="email"
              {...register("email")}
            />
            <ErrorMessage errors={errors} name="Nachname" />

            <label>Geburtsdatum</label>
            <input
              className="w-64 p-2 border-gray-300 border-2 rounded-xl"
              type="text"
              placeholder="DD.MM.YYYY"
              {...register("geburtsdatum")}
            />
            <label>Adresse</label>
            <input
              className="w-64 p-2 border-gray-300 border-2 rounded-xl"
              type="text"
              placeholder="Adresse"
              {...register("adresse")}
            />
            <ErrorMessage errors={errors} name="Adresse" />
          </div>

          <div className="flex flex-col max-w-md gap-4">
            {/* <Input placeholder="name" /> */}
            <label>Eintrittsdatum</label>
            <input
              className="w-64 p-2 border-gray-300 border-2 rounded-xl"
              type="text"
              placeholder="DD.MM.YYYY"
              {...register("eintrittsdatum")}
            />
            <ErrorMessage errors={errors} name="Eintrittsdatum" />

            {/* start of component that should only show in offboarding*/}

            {type === "Offboarding" ? (
              <>
                <label>Austrittsdatum</label>
                <input
                  className="w-64 p-2 border-gray-300 border-2 rounded-xl"
                  type="text"
                  placeholder="DD.MM.YYYY"
                  {...register("austrittsdatum")}
                />
                <ErrorMessage errors={errors} name="Austrittsdatum" />
              </>
            ) : (
              ""
            )}

            {/* end of component that should only show in offboarding */}
            <label>Position</label>
            <input
              className="w-64 p-2 border-gray-300 border-2 rounded-xl"
              type="text"
              placeholder="Position"
              {...register("position")}
            />
            <ErrorMessage errors={errors} name="Position" />
            <input type="hidden" {...register("type")} value={type} />
          </div>
        </div>
        <Button variant={"outline"} type="submit" className="self-center">
          Hinzufügen
        </Button>
      </form>
    </>
  );
};
