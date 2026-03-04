import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/trycatch';
import { ErrorMessage } from '@hookform/error-message';
import { ComponentProps } from 'react';
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form';

type FormFieldsProps<TFieldValues extends FieldValues> = Omit<
  ComponentProps<'input'>,
  'name'
> & {
  errors: FieldErrors<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  name: Path<TFieldValues>;
  placeholder?: string;
  label?: string;
  type?: string;
  required?: boolean;
};

const FormFields = <TFieldValues extends FieldValues>({
  errors,
  register,
  label,
  name,
  className,
  ...props
}: FormFieldsProps<TFieldValues>) => {
  return (
    <>
      {label && <Label>{label}</Label>}
      <Input
        className={cn('rounded-xl', className)}
        {...props}
        {...register(name)}
      />
      <ErrorMessage
        errors={errors}
        name={name as any}
        render={({ message }) => (
          <p className="text-red-400 text-sm">{message}</p>
        )}
      />
    </>
  );
};

export default FormFields;
