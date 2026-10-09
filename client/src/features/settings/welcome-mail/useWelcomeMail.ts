import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWelcomeMail, saveWelcomeMail, type WelcomeMailSettings } from './welcomeMail.api';

const welcomeMailKey = ['automation', 'welcome-mail'] as const;

export function useWelcomeMail() {
  return useQuery({
    queryKey: welcomeMailKey,
    queryFn: getWelcomeMail,
  });
}

export function useSaveWelcomeMail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WelcomeMailSettings) => saveWelcomeMail(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: welcomeMailKey });
    },
  });
}
