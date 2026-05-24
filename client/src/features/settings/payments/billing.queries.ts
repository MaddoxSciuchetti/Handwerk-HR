import { queryOptions } from '@tanstack/react-query';
import { fetchBillingSubscription } from './payments.api';
import type { BillingSubscription } from './billing.types';

export const billingQueries = {
  subscription: () => {
    return queryOptions<BillingSubscription | null, Error>({
      queryKey: ['billing', 'subscription'],
      queryFn: fetchBillingSubscription,
    });
  },
};
