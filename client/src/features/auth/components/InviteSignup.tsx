import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { acceptInvite, getInviteDetails } from '../api/invite.api';
import {
  AcceptInviteFormValues,
  acceptInviteSchema,
} from '../schemas/auth.schemas';
import PasswordValidationBar from './password_validation/PasswordValidationBar';
import DoorManCard from './resuable/DoorManCard';

type Props = { token: string };

export function InviteSignup({ token }: Props) {
  const navigate = useNavigate();

  const {
    data: invite,
    isPending: isLoadingInvite,
    isError: isInviteError,
  } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => getInviteDetails(token),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    mutate: accept,
    isPending: isAccepting,
    error: acceptError,
    isError: isAcceptError,
  } = useMutation({
    mutationFn: (data: AcceptInviteFormValues) => acceptInvite(token, data),
    onSuccess: () => {
      navigate({ to: '/login' });
    },
  });

  const onSubmit: SubmitHandler<AcceptInviteFormValues> = (data) => {
    accept(data);
  };

  const passwordValue = useWatch({ control, name: 'password' }) || '';

  if (isLoadingInvite) {
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );
  }

  if (isInviteError) {
    return (
      <DoorManCard>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Invalid Invitation
          </h2>
          <p className="text-sm text-muted-foreground">
            This invite link is invalid or has expired. Please ask the
            organization admin to send a new invite.
          </p>
        </div>
      </DoorManCard>
    );
  }

  if (isAccepting) {
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );
  }

  return (
    <DoorManCard>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Join {invite?.orgName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create your account to accept the invitation.
        </p>
      </div>

      {isAcceptError && (
        <div className="mb-3 text-[var(--destructive)] text-sm">
          {(acceptError as Error)?.message || 'An error occurred'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email is locked — comes from the invite */}
        <div className="space-y-1">
          <label className="text-foreground text-sm font-medium">
            Email Address
          </label>
          <input
            type="email"
            value={invite?.email ?? ''}
            readOnly
            disabled
            className="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <FormFields
              errors={errors}
              register={register}
              name="firstName"
              label="First Name"
              labelClassName="text-foreground text-sm font-medium"
              id="firstName"
              type="text"
              className="border-input bg-background text-foreground"
            />
          </div>
          <div className="flex-1">
            <FormFields
              errors={errors}
              register={register}
              name="lastName"
              label="Last Name"
              labelClassName="text-foreground text-sm font-medium"
              id="lastName"
              type="text"
              className="border-input bg-background text-foreground"
            />
          </div>
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
          <PasswordValidationBar password={passwordValue} minLength={6} />
        </div>

        <FormFields
          errors={errors}
          register={register}
          name="confirmPassword"
          label="Confirm Password"
          labelClassName="text-foreground text-sm font-medium"
          id="confirmPassword"
          type="password"
          className="border-input bg-background text-foreground"
        />

        <Button type="submit" className="w-full mt-2" variant="outline">
          Create Account & Join {invite?.orgName}
        </Button>
      </form>
    </DoorManCard>
  );
}
