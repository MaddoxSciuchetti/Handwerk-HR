import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { SubmitHandler, useForm } from 'react-hook-form';
import { login } from '../api/auth.api';
import { LoginFormValues, loginSchema } from '../schemas/auth.schemas';

type LoginApiError = {
  status?: number;
  errorCode?: string;
  message?: string;
};

export function useLogin() {
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

  return {
    register,
    handleSubmit,
    onSubmit,
    authErrorMessage,
    errors,
    isPending,
    error,
  };
}
