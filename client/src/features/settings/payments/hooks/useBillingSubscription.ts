import { useQuery } from '@tanstack/react-query';
import { billingQueries } from '../billing.queries';

export function useBillingSubscription() {
  return useQuery(billingQueries.subscription());
}
