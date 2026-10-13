import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WelcomeMailSettings } from '@/features/settings/welcome-mail/welcomeMail.api';
import { getDepartureMail, saveDepartureMail } from './departureMail.api';

const departureMailKey = ['automation', 'departure-mail'] as const;

export function useDepartureMail() {
  return useQuery({
    queryKey: departureMailKey,
    queryFn: getDepartureMail,
  });
}

export function useSaveDepartureMail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WelcomeMailSettings) => saveDepartureMail(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departureMailKey });
    },
  });
}
