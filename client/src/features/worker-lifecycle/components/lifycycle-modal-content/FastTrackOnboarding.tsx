import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getMicrosoftMailAddresses } from '@/features/worker-task-management/api/engagementMail.api';
import { Input } from '@/components/ui/input';
import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  const senderId = useId();
  const [senderAddress, setSenderAddress] = useState('');
  const addresses = useQuery({
    queryKey: ['bsb-mail-addresses'],
    queryFn: getMicrosoftMailAddresses,
  });
  const senders =
    addresses.data?.addresses.filter((address) => address.kind === 'mailbox') ??
    [];
  const senderSelected = senders.some(
    (sender) => sender.email === senderAddress
  );
  const { mutate, isPending } = useMutation({
    mutationFn: (value: { email: string; senderAddress: string }) =>
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
    if (!senderSelected) {
      toast.error('Bitte einen Absender wählen');
      return;
    }
    mutate({ email: value, senderAddress });
  };

  return (
    <form
      className="flex shrink-0 flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isPending) send();
      }}
    >
      <label htmlFor={senderId} className="sr-only">
        Absender
      </label>
      <Select
        value={senderAddress}
        onValueChange={setSenderAddress}
        required
        disabled={isPending || addresses.isLoading}
      >
        <SelectTrigger
          id={senderId}
          className="w-full"
          aria-label="Absender"
          aria-required="true"
        >
          <SelectValue
            placeholder={
              addresses.isLoading
                ? 'Absender werden geladen…'
                : 'Absender wählen'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {senders.map((sender) => (
            <SelectItem key={sender.email} value={sender.email}>
              {sender.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(addresses.isError ||
        addresses.data?.error ||
        (!addresses.isLoading && senders.length === 0)) && (
        <p role="alert" className="w-full text-sm text-destructive">
          {addresses.data?.error ||
            (addresses.isError
              ? 'Absender konnten nicht geladen werden.'
              : 'Keine Absender verfügbar.')}
        </p>
      )}
      <label htmlFor={emailId} className="sr-only">
        E-Mail des Mitarbeiters
      </label>
      <Input
        id={emailId}
        className="flex-1 focus-visible:ring-2 focus-visible:ring-inset"
        type="email"
        autoComplete="email"
        required
        disabled={isPending}
        value={email}
        placeholder="E-Mail"
        maxLength={254}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button
        type="submit"
        className="rounded-2xl"
        disabled={isPending || !senderSelected}
      >
        {isPending ? 'Legt an…' : 'Anlegen'}
      </Button>
    </form>
  );
}
