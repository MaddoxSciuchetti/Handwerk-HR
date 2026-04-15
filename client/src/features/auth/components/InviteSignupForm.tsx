import { DoorManCard } from '@/components/alerts-doorman/DoorManError';
import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from '@tanstack/react-router';
import { useInviteSignup } from '../hooks/useInviteSignup';
import { InviteSignupBody } from './InviteSignupBody';
import { InviteSignupHeader } from './InviteSignupHeader';
import DoorManWrapper from './resuable/DoorManCard';
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
      <DoorManCard
        title="Invite not valid"
        message={authErrorMessage || ''}
        alternativeMessage="This invite is invalid, expired, or already used."
        actiontext="Go to login"
        actionUrl="/login"
      />
    );
  }
  if (acceptMutation.isSuccess) {
    return (
      <DoorManCard
        title="Account created"
        message="Your account was created successfully. Please verify your email and continue to login."
        alternativeMessage="Your account was created successfully. Please verify your email and continue to login."
        actiontext="Go to login"
        actionUrl="/login"
      />
    );
  }

  return (
    <DoorManWrapper>
      <InviteSignupHeader inviteQuery={inviteQuery} />
      {authErrorMessage && (
        <div className="mb-3 text-sm text-(--destructive)">
          {authErrorMessage}
        </div>
      )}
      <InviteSignupBody
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        errors={errors}
        register={register}
        passwordValue={passwordValue}
        acceptMutation={acceptMutation}
      />
      <div className="mt-4">
        <DoorManFooter
          description={`Already have an account? ${''}`}
          action="Signin"
          nav={() => navigate({ to: '/login' })}
        />
      </div>
    </DoorManWrapper>
  );
}
