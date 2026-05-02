import { apiJson } from '@/config/apiClient';

type StripeRedirectResponse = { url: string };

export const createCheckoutSession = (lookupKey: string) =>
  apiJson.post<StripeRedirectResponse, { lookup_key: string }>(
    '/billing/checkout',
    { lookup_key: lookupKey }
  );

export const createPortalSession = (sessionId?: string) =>
  apiJson.post<StripeRedirectResponse, { session_id?: string }>(
    '/billing/portal',
    sessionId ? { session_id: sessionId } : {}
  );
