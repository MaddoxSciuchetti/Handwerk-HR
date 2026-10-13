import { useQuery } from '@tanstack/react-query';
import { billingQueries } from '../billing.queries';

export function useBillingInvoices() {
  return useQuery(billingQueries.invoices());
}
