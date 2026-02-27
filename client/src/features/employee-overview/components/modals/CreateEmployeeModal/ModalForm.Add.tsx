import { Button } from '@/components/ui/button';
import {
  FieldErrors,
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';
import { CreateMitarbeiterInputs } from '../../../consts/CreateMitarbeiterInputs';
import FormFields from '../FormFields';
import { TWorkerSchema } from '@/features/employee-overview/schemas/schema';

type ModalMitarbeiterFormProps = {
  handleSubmit: UseFormHandleSubmit<TWorkerSchema>;
  register: UseFormRegister<TWorkerSchema>;
  errors: FieldErrors<TWorkerSchema>;
  onFormSubmit: SubmitHandler<TWorkerSchema>;
};

const ModalMitarbeiterForm = ({
  handleSubmit,
  register,
  onFormSubmit,
  errors,
}: ModalMitarbeiterFormProps) => {
  return (
    <>
      <p className="mb-5">
        Ein Mitarbeiter erhält eine E-Mail mit der Bitte, sich einzuloggen.
      </p>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex flex-col gap-5 w-full"
      >
        {CreateMitarbeiterInputs.map((value, index) => (
          <FormFields
            type={value.type}
            placeholder={value.placeholder}
            name={value.name}
            errors={errors}
            register={register}
            index={index}
            required={value.required}
          />
        ))}
        <Button
          className="w-full my-2 cursor-pointer "
          variant={'outline'}
          type="submit"
        >
          Nutzer Erstellen
        </Button>
      </form>
    </>
  );
};

export default ModalMitarbeiterForm;
