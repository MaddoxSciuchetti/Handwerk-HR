import FormFields from '@/components/form/FormFields';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { LoginFormValues } from '../schemas/auth.schemas';

export function InputFields({
  errors,
  register,
}: {
  errors: FieldErrors<LoginFormValues>;
  register: UseFormRegister<LoginFormValues>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="email"
          label="Email Address"
          labelClassName="text-foreground text-sm font-medium"
          id="email"
          type="email"
          placeholder="m@example.com"
          className="border-input bg-background text-foreground"
        />
      </div>

      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="password"
          label="Password"
          labelClassName="text-foreground text-sm font-medium"
          id="password"
          type="password"
          className="border-input bg-background text-foreground"
        />
      </div>
    </div>
  );
}
