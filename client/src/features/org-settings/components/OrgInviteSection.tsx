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
    <div className="rounded-lg  bg-card ">
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Mitarbeiter einladen
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Send einen Einladungslink zu einem neuen Mitarbeiter, der sich dann registrieren kann.
      </p>

      {isSuccess && (
        <p className="mb-4 text-sm text-green-600 dark:text-green-400">
          Einladung erfolgreich gesendet.
        </p>
      )}

      {isError && (
        <p className="mb-4 text-sm text-[var(--destructive)]">
          {(error as Error)?.message || 'Fehler beim Senden der Einladung.'}
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
            placeholder="email@example.com"
            className="border-input bg-background text-foreground"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? <Spinner className="w-4" /> : 'Einladung senden'}
        </Button>
      </form>
    </div>
  );
}
