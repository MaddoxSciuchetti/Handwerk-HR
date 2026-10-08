import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ALL_WORKER_DATA } from '../../consts/query-key.consts';

type FastTrackOnboardingProps = {
  onStarted: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FastTrackOnboarding({ onStarted }: FastTrackOnboardingProps) {
  const [email, setEmail] = useState('');
  const { mutate, isPending } = useMutation({
    mutationFn: (value: string) =>
      API.post('/worker/fast-track', { email: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ALL_WORKER_DATA],
        refetchType: 'all',
      });
      toast.success('Onboarding gestartet');
      onStarted();
    },
    onError: () => toast.error('Onboarding konnte nicht gestartet werden'),
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
        {isPending ? 'Sendet…' : 'Senden'}
      </Button>
    </div>
  );
}
