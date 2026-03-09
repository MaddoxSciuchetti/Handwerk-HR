import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  RegisterFormValues,
  registerSchema,
} from '../../../../../server/src/schemas/auth.schemas';
import { signup } from '../api/auth.api';
import DoorManCard from './resuable/DoorManCard';
import DoorManFooter from './resuable/DoorManFooter';

export function SignupForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    mutate: createAccount,
    error,
    isError,
    isPending,
  } = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      navigate({ to: '/worker-lifycycle' });
    },
    onError: () => {
      console.log(
        isError ? `this is error ${error.message}` : 'nothing received'
      );
    },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = (data) => {
    createAccount(data);
  };

  if (isPending)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );

  return (
    <DoorManCard>
      {isError && (
        <div className="mb-3 text-red-400">
          {error?.message || 'An error occurred'}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <FormFields
            errors={errors}
            register={register}
            name="email"
            label="Email Address"
            id="email"
            type="email"
            required
          />
        </div>
        <div className="flex gap-3">
          <div className="space-y-2 flex-1">
            <FormFields
              errors={errors}
              register={register}
              name="firstName"
              label="Vorname"
              id="firstName"
              type="text"
              required
            />
          </div>
          <div className="space-y-2 flex-1">
            <FormFields
              errors={errors}
              register={register}
              name="lastName"
              id="lastName"
              type="text"
              label="Nachname"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <FormFields
            errors={errors}
            register={register}
            name="password"
            label="Password"
            id="password"
            type="password"
            required
          />
          <p className="text-gray-400 text-xs text-left mt-2">
            - Must be at least 6 characters long.
          </p>
        </div>

        <div className="space-y-2">
          <FormFields
            errors={errors}
            register={register}
            name="confirmPassword"
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full my-2 text-white "
          variant={'outline'}
        >
          Create Account
        </Button>
        <DoorManFooter
          description={`Already have an account? ${''}`}
          action="Signin"
          nav={() => navigate({ to: `/login` })}
        />
      </form>
    </DoorManCard>
  );
}
