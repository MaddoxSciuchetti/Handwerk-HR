import { useNavigate } from '@tanstack/react-router';
import { useStandardLogin } from '../hooks/useStandardLogin';
import { LoginAction } from './LoginAction';
import { InputFields } from './LoginBody';
import { PasswordForgot } from './PasswordForgot';
import DoorManCard from './resuable/DoorManCard';
import DoorManFooter from './resuable/DoorManFooter';

export function StandardUserLogin() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isPending,
    error,
    authErrorMessage,
  } = useStandardLogin();

  return (
    <DoorManCard>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        {error && (
          <p className="mb-4 rounded-md border border-(--destructive) bg-(--destructive)/10 px-3 py-2 text-sm text-(--destructive)">
            {authErrorMessage}
          </p>
        )}
        <InputFields errors={errors} register={register} />
        <PasswordForgot />
        <LoginAction isPending={isPending} />
        <DoorManFooter
          description={`Don't have an account? ${''}`}
          action="Sign up"
          nav={() => navigate({ to: `/signup` })}
        />
      </form>
    </DoorManCard>
  );
}
