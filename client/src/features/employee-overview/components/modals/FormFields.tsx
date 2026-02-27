import { Input } from '@/components/ui/input';
import { ErrorMessage } from '@hookform/error-message';
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form';
import { Label } from '@/components/ui/label';

type FormFieldsProps<TFieldValues extends FieldValues> = {
  errors: FieldErrors<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  name: Path<TFieldValues>;
  placeholder?: string;
  index?: number;
  label?: string;
  type?: string;
  required?: boolean;
};

const FormFields = <TFieldValues extends FieldValues>({
  errors,
  register,
  index,
  label,
  type,
  placeholder,
  name,
  required,
}: FormFieldsProps<TFieldValues>) => {
  return (
    <div key={index}>
      {label && <Label>{label}</Label>}
      <Input
        type={type}
        placeholder={placeholder}
        {...register(name, {
          required: required,
        })}
      />
      <ErrorMessage
        errors={errors}
        name={name as any}
        render={({ message }) => <p>{message}</p>}
      />
    </div>
  );
};

export default FormFields;
