import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { sendOrgInvite } from '@/features/auth/api/invite.api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' })
    .max(255),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function OrgInviteSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '' },
  });

  const {
    mutate: invite,
    isPending,
    isSuccess,
    isError,
    error,
    reset: resetMutation,
  } = useMutation({
    mutationFn: (data: InviteFormValues) =>
      sendOrgInvite({ email: data.email }),
    onSuccess: () => {
      reset();
    },
  });

  const onSubmit: SubmitHandler<InviteFormValues> = (data) => {
    resetMutation();
    invite(data);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Invite Team Member
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Send an invitation link to a new member. The link will expire in 48
        hours.
      </p>

      {isSuccess && (
        <p className="mb-4 text-sm text-green-600 dark:text-green-400">
          Invitation sent successfully.
        </p>
      )}

      {isError && (
        <p className="mb-4 text-sm text-(--destructive)">
          {(error as Error)?.message || 'Failed to send invite.'}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex gap-3">
        <div className="flex-1">
          <FormFields
            errors={errors}
            register={register}
            name="email"
            id="invite-email"
            type="email"
            placeholder="colleague@company.com"
            className="border-input bg-background text-foreground"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? <Spinner className="w-4" /> : 'Send Invite'}
        </Button>
      </form>
    </div>
  );
}
