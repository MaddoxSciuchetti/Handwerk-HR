import FormFields from '@/components/form/FormFields';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { RegisterOrgFormValues } from '../schemas/auth.schemas';
import PasswordValidationBar from './password_validation/PasswordValidationBar';

type RegisterBodyProps = {
  errors: FieldErrors<RegisterOrgFormValues>;
  register: UseFormRegister<RegisterOrgFormValues>;
  passwordValue: string;
};
export function RegisterBody({
  errors,
  register,
  passwordValue,
}: RegisterBodyProps) {
  return (
    <>
      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="displayName"
          label="Display Name"
          labelClassName="text-foreground text-sm font-medium"
          id="displayName"
          type="text"
          className="border-input bg-background text-foreground"
        />
      </div>

      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="email"
          label="Email Address"
          labelClassName="text-foreground text-sm font-medium"
          id="email"
          type="email"
          className="border-input bg-background text-foreground"
        />
      </div>
      <div className="flex gap-3">
        <div className="space-y-2 flex-1">
          <FormFields
            errors={errors}
            register={register}
            name="firstName"
            label="Vorname"
            labelClassName="text-foreground text-sm font-medium"
            id="firstName"
            type="text"
            className="border-input bg-background text-foreground"
          />
        </div>
        <div className="space-y-2 flex-1">
          <FormFields
            errors={errors}
            register={register}
            name="lastName"
            id="lastName"
            type="text"
            label="Nachname"
            labelClassName="text-foreground text-sm font-medium"
            className="border-input bg-background text-foreground"
          />
        </div>
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
        <PasswordValidationBar password={passwordValue} minLength={6} />
      </div>

      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="confirmPassword"
          label="Confirm Password"
          labelClassName="text-foreground text-sm font-medium"
          id="confirmPassword"
          type="password"
          className="border-input bg-background text-foreground"
        />
      </div>
    </>
  );
}
