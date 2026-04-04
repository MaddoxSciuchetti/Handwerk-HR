import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { SubmitHandler, useForm } from 'react-hook-form';
import { login } from '../api/auth.api';
import { LoginFormValues, loginSchema } from '../schemas/auth.schemas';
import DoorManCard from './resuable/DoorManCard';
import DoorManFooter from './resuable/DoorManFooter';

type LoginApiError = {
  status?: number;
  errorCode?: string;
  message?: string;
};

export function LoginComponent() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const {
    mutate: signin,
    error,
    isPending,
  } = useMutation<unknown, LoginApiError, LoginFormValues>({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: '/worker-lifycycle' });
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = (data) => {
    signin(data);
  };

  const authErrorMessage =
    error?.message || 'Nutzer nicht gefunden oder Zugangsdaten sind falsch.';

  return (
    <DoorManCard>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        {error && (
          <p className="mb-4 rounded-md border border-[var(--destructive)] bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
            {authErrorMessage}
          </p>
        )}

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

        <div className="mt-4">
          <Button
            type="button"
            onClick={() => navigate({ to: '/password/forgot' })}
            className="text-foreground underline text-sm hover:text-accent-foreground"
          >
            Forgot Password?
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            variant={'outline'}
            type="submit"
            className="w-full cursor-pointer"
            disabled={isPending}
          >
            {isPending ? 'Logging in...' : 'Login'}
          </Button>

          <DoorManFooter
            description={`Don't have an account? ${''}`}
            action="Sign up"
            nav={() => navigate({ to: `/signup` })}
          />
        </div>
      </form>
    </DoorManCard>
  );
}
