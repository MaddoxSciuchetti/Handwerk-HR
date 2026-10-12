import { queryOptions } from '@tanstack/react-query';
import { fetchBillingInvoices, fetchBillingSubscription } from './payments.api';
import type { BillingInvoice, BillingSubscription } from './billing.types';

export const billingQueries = {
  subscription: () => {
    return queryOptions<BillingSubscription | null, Error>({
      queryKey: ['billing', 'subscription'],
      queryFn: fetchBillingSubscription,
    });
  },
  invoices: () => {
    return queryOptions<{ invoices: BillingInvoice[] }, Error>({
      queryKey: ['billing', 'invoices'],
      queryFn: fetchBillingInvoices,
    });
  },
};
