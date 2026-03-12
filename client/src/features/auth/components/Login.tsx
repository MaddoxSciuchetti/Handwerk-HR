import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
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
    isError,
    isPending,
  } = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: '/worker-lifycycle' });
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = (data) => {
    signin(data);
  };

  if (isPending) return <LoadingAlert />;
  if (isError) return <ErrorAlert />;

  return (
    <DoorManCard>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
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
