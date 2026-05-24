import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from '@tanstack/react-router';
import { useOrgSignup } from '../hooks/useOrgSignup';
import { OrgSignupBody } from './OrgSignupBody';
import { RegisterBody } from './RegisterBody';
import DoorManWrapper from './resuable/DoorManCard';
import DoorManFooter from './resuable/DoorManFooter';

export function SignupForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    onSubmit,
    goToStepTwo,
    goToStepOne,
    step,
    errors,
    isPending,
    error,
    isError,
    passwordValue,
  } = useOrgSignup();

  if (isPending)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );

  return (
    <DoorManWrapper>
      {isError && (
        <div className="mb-3 text-(--destructive)">
          {error?.message || 'An error occurred'}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {step === 1 ? (
          <>
            <RegisterBody
              errors={errors}
              register={register}
              passwordValue={passwordValue}
            />
            <Button
              type="button"
              className="my-2 w-full"
              variant={'outline'}
              onClick={goToStepTwo}
            >
              Continue
            </Button>
          </>
        ) : (
          <>
            <OrgSignupBody errors={errors} register={register} />
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1"
                variant={'secondary'}
                onClick={goToStepOne}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" variant={'outline'}>
                Create Account
              </Button>
            </div>
          </>
        )}
        <DoorManFooter
          description={`Already have an account? ${''}`}
          action="Signin"
          nav={() => navigate({ to: `/login` })}
        />
      </form>
    </DoorManWrapper>
  );
}
