import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
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
  const { mutate, isPending } = useMutation({
    mutationFn: (value: string) =>
      API.post<FastTrackResponse>('/worker/fast-track', { email: value }),
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
    mutate(value);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="email"
        value={email}
        placeholder="E-Mail"
        maxLength={254}
        onChange={(event) => setEmail(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          send();
        }}
      />
      <Button
        type="button"
        className="rounded-2xl"
        disabled={isPending}
        onClick={send}
      >
        {isPending ? 'Legt an…' : 'Anlegen'}
      </Button>
    </div>
  );
}
