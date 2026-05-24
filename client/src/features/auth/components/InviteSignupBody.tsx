import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/selfmade/button';
import { UseMutationResult } from '@tanstack/react-query';
import {
  FieldErrors,
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';
import { InviteAcceptFormValues } from '../schemas/auth.schemas';
import { AcceptInviteResponse } from '../types/auth.types';
import PasswordValidationBar from './password_validation/PasswordValidationBar';

export function InviteSignupBody({
  handleSubmit,
  onSubmit,
  errors,
  register,
  passwordValue,
  acceptMutation,
}: {
  handleSubmit: UseFormHandleSubmit<InviteAcceptFormValues>;
  onSubmit: SubmitHandler<InviteAcceptFormValues>;
  errors: FieldErrors<InviteAcceptFormValues>;
  register: UseFormRegister<InviteAcceptFormValues>;
  passwordValue: string;
  acceptMutation: UseMutationResult<
    AcceptInviteResponse,
    Error,
    InviteAcceptFormValues
  >;
}) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormFields
        errors={errors}
        register={register}
        name="displayName"
        label="Display Name"
        id="displayName"
        type="text"
      />
      <div className="flex gap-3">
        <FormFields
          errors={errors}
          register={register}
          name="firstName"
          label="Vorname"
          id="firstName"
          type="text"
          className="flex-1"
        />
        <FormFields
          errors={errors}
          register={register}
          name="lastName"
          label="Nachname"
          id="lastName"
          type="text"
          className="flex-1"
        />
      </div>
      <FormFields
        errors={errors}
        register={register}
        name="password"
        label="Password"
        id="password"
        type="password"
      />
      <PasswordValidationBar password={passwordValue} minLength={6} />
      <FormFields
        errors={errors}
        register={register}
        name="confirmPassword"
        label="Confirm Password"
        id="confirmPassword"
        type="password"
      />
      <Button
        type="submit"
        className="w-full"
        disabled={acceptMutation.isPending}
      >
        {acceptMutation.isPending ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
