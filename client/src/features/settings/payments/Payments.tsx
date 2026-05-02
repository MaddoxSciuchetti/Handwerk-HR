import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PaymentCheckoutDisplay } from './PaymentCheckoutDisplay';
import { createCheckoutSession, createPortalSession } from './payments.api';
import { usePaymentRedirect } from './usePaymentRedirect';

function Payments() {
  const { status, sessionId } = usePaymentRedirect();
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get('success')) {
      toast.success('Abo erfolgreich aktiviert.');
      window.history.replaceState({}, '', '/settings/payments');
    } else if (query.get('canceled')) {
      toast.info('Bezahlvorgang abgebrochen.');
      window.history.replaceState({}, '', '/settings/payments');
    }
  }, []);

  const handleSubscribe = async (priceId: string) => {
    try {
      setPendingPriceId(priceId);
      const { url } = await createCheckoutSession(priceId);
      window.location.assign(url);
    } catch {
      toast.error('Checkout konnte nicht gestartet werden.');
      setPendingPriceId(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsPortalLoading(true);
      const { url } = await createPortalSession(sessionId ?? undefined);
      window.location.assign(url);
    } catch {
      toast.error('Kundenportal konnte nicht geöffnet werden.');
      setIsPortalLoading(false);
    }
  };

  const hasActiveSubscription = status === 'success';

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <PaymentCheckoutDisplay
        hasActiveSubscription={hasActiveSubscription}
        pendingPriceId={pendingPriceId}
        isPortalLoading={isPortalLoading}
        onSubscribe={handleSubscribe}
        onManageBilling={handleManageBilling}
      />
    </div>
  );
}

export default Payments;
