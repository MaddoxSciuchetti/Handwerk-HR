import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { signup } from '../api/auth.api';
import { RegisterFormValues, registerSchema } from '../schemas/auth.schemas';

export function useOrgSignup() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
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
      navigate({ to: '/login' });
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

  const passwordValue = useWatch({ control, name: 'password' }) || '';

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isPending,
    error,
    isError,
    passwordValue,
  };
}
