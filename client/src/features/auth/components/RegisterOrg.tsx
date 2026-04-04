import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { registerOrg } from '../api/auth.api';
import {
  RegisterOrgFormValues,
  RegisterOrgStep1Values,
  RegisterOrgStep2Values,
  registerOrgStep1Schema,
  registerOrgStep2Schema,
} from '../schemas/auth.schemas';
import { useRegisterOrgStore } from '../store/registerOrgStore';
import PasswordValidationBar from './password_validation/PasswordValidationBar';
import DoorManCard from './resuable/DoorManCard';
import DoorManFooter from './resuable/DoorManFooter';

// ─── Step 1: User Info ────────────────────────────────────────────────────────

function Step1() {
  const { setStep1Data, setStep } = useRegisterOrgStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterOrgStep1Values>({
    resolver: zodResolver(registerOrgStep1Schema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = useWatch({ control, name: 'password' }) || '';

  const onSubmit: SubmitHandler<RegisterOrgStep1Values> = (data) => {
    setStep1Data(data);
    setStep(2);
  };

  return (
    <DoorManCard>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">Step 1 of 2</p>
        <h2 className="text-lg font-semibold text-foreground">Your account</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
        <div className="flex gap-3">
          <div className="flex-1">
            <FormFields
              errors={errors}
              register={register}
              name="firstName"
              label="First Name"
              labelClassName="text-foreground text-sm font-medium"
              id="firstName"
              type="text"
              className="border-input bg-background text-foreground"
            />
          </div>
          <div className="flex-1">
            <FormFields
              errors={errors}
              register={register}
              name="lastName"
              label="Last Name"
              labelClassName="text-foreground text-sm font-medium"
              id="lastName"
              type="text"
              className="border-input bg-background text-foreground"
            />
          </div>
        </div>
        <div>
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
        <Button type="submit" className="mt-2 w-full" variant="outline">
          Continue
        </Button>
      </form>
      <DoorManFooter
        description="Already have an account? "
        action="Sign in"
        nav={() => (window.location.href = '/login')}
      />
    </DoorManCard>
  );
}

// ─── Step 2: Company Info ─────────────────────────────────────────────────────

const ORG_SIZES = [
  { value: '', label: 'Select size (optional)' },
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
] as const;

function Step2() {
  const navigate = useNavigate();
  const { step1Data, setStep, reset } = useRegisterOrgStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterOrgStep2Values>({
    resolver: zodResolver(registerOrgStep2Schema),
    defaultValues: {
      orgName: '',
      orgDescription: '',
      orgEmail: '',
      orgPhoneNumber: '',
      orgWebsiteUrl: '',
      orgCountry: '',
      orgIndustry: '',
      orgSize: undefined,
    },
  });

  const {
    mutate: submitRegistration,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: (orgData: RegisterOrgStep2Values) => {
      const payload: RegisterOrgFormValues = {
        ...step1Data!,
        ...orgData,
        orgSize: orgData.orgSize || undefined,
      };
      return registerOrg(payload);
    },
    onSuccess: () => {
      reset();
      navigate({ to: '/login' });
    },
  });

  const onSubmit: SubmitHandler<RegisterOrgStep2Values> = (data) => {
    submitRegistration(data);
  };

  if (isPending)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );

  return (
    <DoorManCard>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">Step 2 of 2</p>
        <h2 className="text-lg font-semibold text-foreground">Your company</h2>
      </div>
      {isError && (
        <div className="mb-3 text-sm text-[var(--destructive)]">
          {(error instanceof Error ? error.message : null) ||
            'An error occurred'}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
        <FormFields
          errors={errors}
          register={register}
          name="orgDescription"
          label="Description (optional)"
          labelClassName="text-foreground text-sm font-medium"
          id="orgDescription"
          type="text"
          className="border-input bg-background text-foreground"
        />
        <div className="flex gap-3">
          <div className="flex-1">
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
          <div className="flex-1">
            <FormFields
              errors={errors}
              register={register}
              name="orgPhoneNumber"
              label="Phone (optional)"
              labelClassName="text-foreground text-sm font-medium"
              id="orgPhoneNumber"
              type="tel"
              className="border-input bg-background text-foreground"
            />
          </div>
        </div>
        <FormFields
          errors={errors}
          register={register}
          name="orgWebsiteUrl"
          label="Website (optional)"
          labelClassName="text-foreground text-sm font-medium"
          id="orgWebsiteUrl"
          type="url"
          placeholder="https://example.com"
          className="border-input bg-background text-foreground"
        />
        <div className="flex gap-3">
          <div className="flex-1">
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
          <div className="flex-1">
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
        <div className="flex min-w-0 flex-col gap-1">
          <label
            htmlFor="orgSize"
            className="text-foreground text-sm font-medium"
          >
            Company Size (optional)
          </label>
          <select
            id="orgSize"
            {...register('orgSize')}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ORG_SIZES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={() => setStep(1)}
          >
            Back
          </Button>
          <Button type="submit" variant="outline" className="flex-1">
            Create Account
          </Button>
        </div>
      </form>
    </DoorManCard>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

const RegisterOrg = () => {
  const step = useRegisterOrgStore((s) => s.step);
  return step === 1 ? <Step1 /> : <Step2 />;
};

export default RegisterOrg;
