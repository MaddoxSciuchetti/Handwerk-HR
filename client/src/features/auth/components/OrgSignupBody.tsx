import FormFields from '@/components/form/FormFields';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { RegisterOrgFormValues } from '../schemas/auth.schemas';

type OrgSignupBodyProps = {
  errors: FieldErrors<RegisterOrgFormValues>;
  register: UseFormRegister<RegisterOrgFormValues>;
};

export function OrgSignupBody({ errors, register }: OrgSignupBodyProps) {
  return (
    <>
      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="orgName"
          label="Company Name"
          labelClassName="text-foreground text-sm font-medium"
          id="orgName"
          type="text"
          className="border-input bg-background text-foreground"
        />
      </div>

      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="orgDescription"
          label="Company Description (optional)"
          labelClassName="text-foreground text-sm font-medium"
          id="orgDescription"
          type="text"
          className="border-input bg-background text-foreground"
        />
      </div>

      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="orgEmail"
          label="Company Email (optional)"
          labelClassName="text-foreground text-sm font-medium"
          id="orgEmail"
          type="email"
          className="border-input bg-background text-foreground"
        />
      </div>

      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="orgPhoneNumber"
          label="Company Phone (optional)"
          labelClassName="text-foreground text-sm font-medium"
          id="orgPhoneNumber"
          type="text"
          className="border-input bg-background text-foreground"
        />
      </div>

      <div className="space-y-2">
        <FormFields
          errors={errors}
          register={register}
          name="orgWebsiteUrl"
          label="Company Website (optional)"
          labelClassName="text-foreground text-sm font-medium"
          id="orgWebsiteUrl"
          type="url"
          className="border-input bg-background text-foreground"
        />
      </div>

      <div className="flex gap-3">
        <div className="space-y-2 flex-1">
          <FormFields
            errors={errors}
            register={register}
            name="orgCountry"
            label="Country (optional)"
            labelClassName="text-foreground text-sm font-medium"
            id="orgCountry"
            type="text"
            className="border-input bg-background text-foreground"
          />
        </div>
        <div className="space-y-2 flex-1">
          <FormFields
            errors={errors}
            register={register}
            name="orgIndustry"
            label="Industry (optional)"
            labelClassName="text-foreground text-sm font-medium"
            id="orgIndustry"
            type="text"
            className="border-input bg-background text-foreground"
          />
        </div>
      </div>
    </>
  );
}
