import { useEffect, useState } from 'react';

type RedirectStatus = 'idle' | 'success' | 'canceled';

type PaymentRedirectState = {
  status: RedirectStatus;
  sessionId: string | null;
};

export function usePaymentRedirect(): PaymentRedirectState {
  const [state, setState] = useState<PaymentRedirectState>({
    status: 'idle',
    sessionId: null,
  });

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      setState({ status: 'success', sessionId: query.get('session_id') });
    } else if (query.get('canceled')) {
      setState({ status: 'canceled', sessionId: null });
    }
  }, []);

  return state;
}
