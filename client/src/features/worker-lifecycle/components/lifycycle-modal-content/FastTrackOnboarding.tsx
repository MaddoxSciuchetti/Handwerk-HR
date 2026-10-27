import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';

type FastTrackOnboardingProps = {
  onCreated: (draft: { engagementId: string }) => void;
};

type FastTrackResponse = {
  success: boolean;
  data: {
    worker: { id: string };
    engagement: { id: string };
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FastTrackOnboarding({ onCreated }: FastTrackOnboardingProps) {
  const [email, setEmail] = useState('');
  const emailId = useId();
  const { mutate, isPending } = useMutation({
    mutationFn: (value: { email: string }) =>
      API.post<FastTrackResponse>('/worker/fast-track', value),
    onSuccess: (response) => {
      const body = response as unknown as FastTrackResponse;
      queryClient.invalidateQueries({
        queryKey: [ALL_WORKER_DATA],
        refetchType: 'all',
      });
      toast.success('Mitarbeiter angelegt');
      onCreated({ engagementId: body.data.engagement.id });
    },
    onError: () => toast.error('Mitarbeiter konnte nicht angelegt werden'),
  });

  const send = () => {
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      toast.error('Bitte eine gültige E-Mail eingeben');
      return;
    }
    mutate({ email: value });
  };

  return (
    <form
      className="flex shrink-0 flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isPending) send();
      }}
    >
      <label htmlFor={emailId} className="sr-only">
        E-Mail des Mitarbeiters
      </label>
      <Input
        id={emailId}
        className="flex-1"
        type="email"
        autoComplete="email"
        required
        disabled={isPending}
        value={email}
        placeholder="E-Mail"
        maxLength={254}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button type="submit" className="rounded-2xl" disabled={isPending}>
        {isPending ? 'Legt an…' : 'Anlegen'}
      </Button>
    </form>
  );
}
