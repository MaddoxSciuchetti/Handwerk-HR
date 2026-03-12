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
  isError: boolean;
  error: { message?: string } | null;
};

const FormModalAdd = ({
  handleSubmit,
  register,
  onFormSubmit,
  errors,
  isError,
  error,
}: FormModalAddProps) => {
  const firstRowInputs = CreateMitarbeiterInputs.slice(0, 2);
  const remainingInputs = CreateMitarbeiterInputs.slice(2);

  return (
    <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden pr-1">
      {isError && (
        <div className="mb-3 text-destructive">
          {error?.message || 'An error occurred'}
        </div>
      )}
      <p className="mb-5 font-light">Neuen Mitarbeiter hinzufügen</p>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        noValidate
        className="flex w-full min-w-0 flex-col gap-5"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {firstRowInputs.map((value) => (
            <FormFields
              key={value.name}
              type={value.type}
              placeholder={value.placeholder}
              name={value.name}
              errors={errors}
              register={register}
            />
          ))}
        </div>

        {remainingInputs.map((value) => (
          <FormFields
            key={value.name}
            type={value.type}
            placeholder={value.placeholder}
            name={value.name}
            errors={errors}
            register={register}
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
    </div>
  );
};

export default FormModalAdd;
