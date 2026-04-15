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
import { Input } from '../ui/selfmade/input';

type FormFieldsProps<TFieldValues extends FieldValues> = Omit<
  ComponentProps<'input'>,
  'name'
> & {
  errors: FieldErrors<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  name: Path<TFieldValues>;
  placeholder?: string;
  label?: string;
  /** Design tokens: `typo-*` or `ds-label-*` (see globals.css). */
  labelClassName?: string;
  type?: string;
  required?: boolean;
};

const FormFields = <TFieldValues extends FieldValues>({
  errors,
  register,
  label,
  labelClassName,
  name,
  className,
  id,
  ...props
}: FormFieldsProps<TFieldValues>) => {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {label && (
        <Label
          htmlFor={id}
          className={cn('ds-label-base', labelClassName)}
        >
          {label}
        </Label>
      )}
      <Input
        className={cn('rounded-xl', className)}
        id={id}
        {...props}
        {...register(name)}
      />
      <ErrorMessage
        errors={errors}
        name={name as unknown as never}
        render={({ message }) => (
          <p className="text-sm text-(--destructive)">{message}</p>
        )}
      />
    </div>
  );
};

export default FormFields;
