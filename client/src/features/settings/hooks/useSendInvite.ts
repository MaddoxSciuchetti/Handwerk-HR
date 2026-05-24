import { createOrgInvite } from '@/features/auth/api/auth.api';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export function useSendInvite() {
  const [mitarbeiterEmail, setMitarbeiterEmail] = useState('');
  const { mutate: sendInvite, isPending } = useMutation({
    mutationFn: createOrgInvite,
    onSuccess: () => {
      toast.success('Einladung erfolgreich gesendet.');
      setMitarbeiterEmail('');
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || 'Einladung konnte nicht gesendet werden.');
    },
  });

  const handleSendInvite = () => {
    const email = mitarbeiterEmail.trim();
    if (!email) {
      toast.error('Bitte eine E-Mail eingeben.');
      return;
    }
    sendInvite({ email });
  };

  return {
    isPending,
    handleSendInvite,
    mitarbeiterEmail,
    setMitarbeiterEmail,
  };
}
