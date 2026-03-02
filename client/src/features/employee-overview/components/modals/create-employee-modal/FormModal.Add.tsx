import { Button } from '@/components/ui/button';
import { CreateWorker } from '@/features/employee-overview/schemas/schema';
import {
  FieldErrors,
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';
import FormFields from '../../../../../components/form/FormFields';
import { CreateMitarbeiterInputs } from '../../../consts/CreateMitarbeiterInputs';

type FormModalAddProps = {
  handleSubmit: UseFormHandleSubmit<CreateWorker>;
  register: UseFormRegister<CreateWorker>;
  errors: FieldErrors<CreateWorker>;
  onFormSubmit: SubmitHandler<CreateWorker>;
};

const FormModalAdd = ({
  handleSubmit,
  register,
  onFormSubmit,
  errors,
}: FormModalAddProps) => {
  return (
    <>
      <p className="mb-5">
        Ein Mitarbeiter erhält eine E-Mail mit der Bitte, sich einzuloggen.
      </p>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex flex-col gap-5 w-full"
      >
        {CreateMitarbeiterInputs.map((value) => (
          <FormFields
            type={value.type}
            placeholder={value.placeholder}
            name={value.name}
            errors={errors}
            register={register}
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

export default FormModalAdd;
