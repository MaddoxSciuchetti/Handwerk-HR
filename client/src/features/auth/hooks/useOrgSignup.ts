import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { signupOrg } from '../api/auth.api';
import {
  RegisterOrgFormValues,
  registerOrgSchema,
} from '../schemas/auth.schemas';

export function useOrgSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: { errors },
  } = useForm<RegisterOrgFormValues>({
    resolver: zodResolver(registerOrgSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      displayName: '',
      password: '',
      confirmPassword: '',
      orgName: '',
      orgDescription: '',
      orgEmail: '',
      orgPhoneNumber: '',
      orgWebsiteUrl: '',
      orgCountry: '',
      orgIndustry: '',
    },
  });

  const {
    mutate: createAccount,
    error,
    isError,
    isPending,
  } = useMutation({
    mutationFn: signupOrg,
    onSuccess: () => {
      navigate({ to: '/login' });
    },
    onError: () => {
      console.log(
        isError ? `this is error ${error.message}` : 'nothing received'
      );
    },
  });

  const onSubmit: SubmitHandler<RegisterOrgFormValues> = (data) => {
    createAccount(data);
  };

  const goToStepTwo = async () => {
    const isValid = await trigger([
      'email',
      'firstName',
      'lastName',
      'displayName',
      'password',
      'confirmPassword',
    ]);
    if (isValid) setStep(2);
  };

  const goToStepOne = () => setStep(1);

  const passwordValue = useWatch({ control, name: 'password' }) || '';

  return {
    step,
    register,
    handleSubmit,
    onSubmit,
    goToStepTwo,
    goToStepOne,
    errors,
    isPending,
    error,
    isError,
    passwordValue,
  };
}
