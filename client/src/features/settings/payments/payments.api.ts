import { apiJson } from '@/config/apiClient';

import type { BillingInvoice, BillingSubscription } from './billing.types';

type StripeRedirectResponse = { url: string };

export const fetchBillingSubscription = () =>
  apiJson.get<BillingSubscription | null>('/billing/subscription');

export const createCheckoutSession = (price: string) =>
  apiJson.post<StripeRedirectResponse, { price: string }>('/billing/checkout', {
    price,
  });

export const createBillingPortalSession = () =>
  apiJson.post<StripeRedirectResponse>('/billing/portal', {});

export const fetchBillingInvoices = () =>
  apiJson.get<{ invoices: BillingInvoice[] }>('/billing/invoices');
