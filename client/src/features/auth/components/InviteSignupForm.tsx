import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from '@tanstack/react-router';
import { useInviteSignup } from '../hooks/useInviteSignup';
import PasswordValidationBar from './password_validation/PasswordValidationBar';
import DoorManCard from './resuable/DoorManCard';
import DoorManFooter from './resuable/DoorManFooter';

type InviteSignupFormProps = {
  token: string;
};

export function InviteSignupForm({ token }: InviteSignupFormProps) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    passwordValue,
    inviteQuery,
    acceptMutation,
    authErrorMessage,
  } = useInviteSignup(token);

  if (inviteQuery.isLoading) {
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <DoorManCard>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Invite not valid</h2>
          <p className="text-sm text-muted-foreground">
            {authErrorMessage ||
              'This invite is invalid, expired, or already used.'}
          </p>
          <Button className="w-full" onClick={() => navigate({ to: '/login' })}>
            Go to login
          </Button>
        </div>
      </DoorManCard>
    );
  }

  if (acceptMutation.isSuccess) {
    return (
      <DoorManCard>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Account created</h2>
          <p className="text-sm text-muted-foreground">
            Your account was created successfully. Please verify your email and
            continue to login.
          </p>
          <Button className="w-full" onClick={() => navigate({ to: '/login' })}>
            Go to login
          </Button>
        </div>
      </DoorManCard>
    );
  }

  return (
    <DoorManCard>
      <div className="mb-4 space-y-1">
        <h2 className="text-xl font-semibold">
          Join {inviteQuery.data.orgName}
        </h2>
        <p className="text-sm text-muted-foreground">
          {inviteQuery.data.email}
        </p>
      </div>

      {authErrorMessage && (
        <div className="mb-3 text-sm text-(--destructive)">
          {authErrorMessage}
        </div>
      )}

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
      <div className="mt-4">
        <DoorManFooter
          description={`Already have an account? ${''}`}
          action="Signin"
          nav={() => navigate({ to: '/login' })}
        />
      </div>
    </DoorManCard>
  );
}
