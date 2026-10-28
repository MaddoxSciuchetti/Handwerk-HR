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

type FastTrackPayload = { email: string } | { name: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveFastTrackPayload(raw: string): FastTrackPayload | null {
  const value = raw.trim();
  if (!value) return null;
  if (EMAIL_PATTERN.test(value)) return { email: value };
  if (value.includes('@')) return null;
  return { name: value };
}

export function FastTrackOnboarding({ onCreated }: FastTrackOnboardingProps) {
  const [value, setValue] = useState('');
  const inputId = useId();
  const { mutate, isPending } = useMutation({
    mutationFn: (payload: FastTrackPayload) =>
      API.post<FastTrackResponse>('/worker/fast-track', payload),
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
    const payload = resolveFastTrackPayload(value);
    if (!payload) {
      toast.error('Bitte einen Namen oder eine gültige E-Mail eingeben');
      return;
    }
    mutate(payload);
  };

  return (
    <form
      className="flex shrink-0 flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isPending) send();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Name oder E-Mail des Mitarbeiters
      </label>
      <Input
        id={inputId}
        className="flex-1 focus-visible:ring-2 focus-visible:ring-inset"
        type="text"
        autoComplete="off"
        required
        disabled={isPending}
        value={value}
        placeholder="Name oder E-Mail"
        maxLength={254}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button type="submit" className="rounded-2xl" disabled={isPending}>
        {isPending ? 'Legt an…' : 'Anlegen'}
      </Button>
    </form>
  );
}
