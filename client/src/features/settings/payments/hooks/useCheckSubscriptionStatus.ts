import queryClient from '@/config/query.client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { billingQueries } from '../billing.queries';

export function useCheckSubscriptionStatus() {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get('success')) {
      toast.success('Abo erfolgreich aktiviert.');
      void queryClient.invalidateQueries({
        queryKey: billingQueries.subscription().queryKey,
      });
      window.history.replaceState({}, '', '/settings/payments');
    } else if (query.get('canceled')) {
      toast.info('Bezahlvorgang abgebrochen.');
      window.history.replaceState({}, '', '/settings/payments');
    }
  }, []);
}
