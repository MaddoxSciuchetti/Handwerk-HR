import { Input } from '@/components/ui/input';
import { ErrorMessage } from '@hookform/error-message';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { TCreateMitarbeiter } from '../../consts/CreateMitarbeiterInputs';
import { TWorkerSchema } from '../../schemas/schema';

type FormFieldsProps = {
  value: TCreateMitarbeiter;
  errors: FieldErrors<TWorkerSchema>;
  register: UseFormRegister<TWorkerSchema>;
  index: number;
};

const FormFields = ({ value, errors, register, index }: FormFieldsProps) => {
  return (
    <>
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
          render={({ message }) => <p>{message}</p>}
        />
      </div>
    </>
  );
};

export default FormFields;
