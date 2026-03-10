import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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

  if (isPending)
    return (
      <CenteredDiv>
        <LoadingAlert />
      </CenteredDiv>
    );
  if (isError)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );

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
              labelClassName="text-white text-sm font-medium"
              id="email"
              type="email"
              placeholder="m@example.com"
              className="text-white bg-gray-600 border-gray-500"
            />
          </div>

          <div className="space-y-2">
            <FormFields
              errors={errors}
              register={register}
              name="password"
              label="Password"
              labelClassName="text-white text-sm font-medium"
              id="password"
              type="password"
              className="text-white bg-gray-600 border-gray-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button
            type="button"
            onClick={() => navigate({ to: '/password/forgot' })}
            className="text-white hover:text-gray-300 underline text-sm"
          >
            Forgot Password?
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            variant={'outline'}
            type="submit"
            className="w-full text-white cursor-pointer"
          >
            Login
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
