import { useState } from 'react';

type RedirectStatus = 'idle' | 'success' | 'canceled';

type PaymentRedirectState = {
  status: RedirectStatus;
  sessionId: string | null;
};

function readPaymentRedirectState(): PaymentRedirectState {
  const query = new URLSearchParams(window.location.search);
  if (query.get('success')) {
    return { status: 'success', sessionId: query.get('session_id') };
  }
  if (query.get('canceled')) {
    return { status: 'canceled', sessionId: null };
  }
  return { status: 'idle', sessionId: null };
}

export function usePaymentRedirect(): PaymentRedirectState {
  const [state] = useState(readPaymentRedirectState);
  return state;
}
