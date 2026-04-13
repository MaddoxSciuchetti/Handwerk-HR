import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { acceptInvite, getInviteDetails } from '../api/auth.api';
import {
  InviteAcceptFormValues,
  inviteAcceptSchema,
} from '../schemas/auth.schemas';

type ApiError = {
  status?: number;
  errorCode?: string;
  message?: string;
};

export function useInviteSignup(token: string) {
  const inviteQuery = useQuery({
    queryKey: ['invite-details', token],
    queryFn: () => getInviteDetails(token),
    enabled: Boolean(token),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InviteAcceptFormValues>({
    resolver: zodResolver(inviteAcceptSchema),
    defaultValues: {
      displayName: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (data: InviteAcceptFormValues) => acceptInvite(token, data),
  });

  const onSubmit: SubmitHandler<InviteAcceptFormValues> = (data) => {
    acceptMutation.mutate(data);
  };

  const passwordValue = useWatch({ control, name: 'password' }) || '';

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    passwordValue,
    inviteQuery,
    acceptMutation,
    authErrorMessage:
      (acceptMutation.error as ApiError | null)?.message ||
      (inviteQuery.error as ApiError | null)?.message ||
      null,
  };
}
