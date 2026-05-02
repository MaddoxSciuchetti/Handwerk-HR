import { apiJson } from '@/config/apiClient';

type StripeRedirectResponse = { url: string };

export const createCheckoutSession = (price: string) =>
  apiJson.post<StripeRedirectResponse, { price: string }>('/billing/checkout', {
    price,
  });

export const createPortalSession = (sessionId?: string) =>
  apiJson.post<StripeRedirectResponse, { session_id?: string }>(
    '/billing/portal',
    sessionId ? { session_id: sessionId } : {}
  );
