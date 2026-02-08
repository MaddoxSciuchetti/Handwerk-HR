import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { ErrorMessage } from "@hookform/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInputs, formSchema } from "@/schemas/zodSchema";
import { Input } from "../ui/input";

interface WorkerDataFormProps {
  type: "Onboarding" | "Offboarding";
  success: (data: FormInputs) => void;
  className?: string;
}

export const WorkerDataForm = ({
  type,
  success,
  className,
  ...props
}: WorkerDataFormProps) => {
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
      <form onSubmit={handleSubmit(onFormSubmit)} className=" gap-4">
        <h3 className="text-lg font-medium text-gray-900  pb-2"></h3>
        <h1 className="text-left pl-10 pb-2">Eingabe Handwerker</h1>
        <div className="grid grid-cols-2 gap-3 px-10 pb-10 items-end">
          <div>
            <Input
              className=""
              type="text"
              placeholder="Vorname"
              {...register("vorname", { required: "erforderlich" })}
            />
            <ErrorMessage errors={errors} name="Vorname" />
          </div>
          {/* {errors.Vorname && errors.Vorname.types && (
              <p>{errors.Vorname.types.required}</p>
            )} */}

          <div>
            <Input
              className=""
              type="text"
              placeholder="Nachname"
              {...register("nachname")}
            />
            <ErrorMessage errors={errors} name="Nachname" />
          </div>

          <div>
            <Input
              className=""
              type="text"
              placeholder="email"
              {...register("email")}
            />
            <ErrorMessage errors={errors} name="Nachname" />
          </div>
          <div>
            <Input
              className=""
              type="text"
              placeholder="Geburtsdatum DD.MM.YYYY"
              {...register("geburtsdatum")}
            />
          </div>

          <div>
            <Input
              className=""
              type="text"
              placeholder="Adresse"
              {...register("adresse")}
            />
            <ErrorMessage errors={errors} name="Adresse" />
          </div>

          {/* <Input placeholder="name" /> */}
          <div>
            <Input
              className=""
              type="text"
              placeholder="Eintrittsdatum DD.MM.YYYY"
              {...register("eintrittsdatum")}
            />
            <ErrorMessage errors={errors} name="Eintrittsdatum" />
          </div>

          {/* start of component that should only show in offboarding*/}

          {type === "Offboarding" ? (
            <>
              <Input
                className=""
                type="text"
                placeholder="Austrittsdatum DD.MM.YYYY"
                {...register("austrittsdatum")}
              />
              <ErrorMessage errors={errors} name="Austrittsdatum" />
            </>
          ) : (
            ""
          )}

          {/* end of component that should only show in offboarding */}
          <div className="">
            <Input
              className=""
              type="text"
              placeholder="Position"
              {...register("position")}
            />
            <ErrorMessage errors={errors} name="Position" />
          </div>

          <Button
            variant={"outline"}
            type="submit"
            className="hover:bg-gray-300"
          >
            Hinzufügen
          </Button>

          <Input type="hidden" {...register("type")} value={type} />
        </div>
      </form>
    </>
  );
};
