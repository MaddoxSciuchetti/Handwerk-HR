import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBillingSubscription } from './hooks/useBillingSubscription';
import { useCheckSubscriptionStatus } from './hooks/useCheckSubscriptionStatus';
import { useSubscriptionTrialEnds } from './hooks/useSubscriptionTrialEnds';
import { PaymentPlanDisplay } from './PaymentCheckoutDisplay';
import {
  createBillingPortalSession,
  createCheckoutSession,
} from './payments.api';
import { paymentPlanLabel } from './payments.consts';
import { usePaymentRedirect } from './usePaymentRedirect';
import { hasStripeManagedSubscription } from './util/subscriptionAccess.util';

function Payments() {
  const { status } = usePaymentRedirect();
  const { data: subscription, isPending: isSubscriptionPending } =
    useBillingSubscription();
  const { trialEndsAt } = useSubscriptionTrialEnds();
  useCheckSubscriptionStatus();
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

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
      const { url } = await createBillingPortalSession();
      window.location.assign(url);
    } catch {
      toast.error('Kundenportal konnte nicht geöffnet werden.');
      setIsPortalLoading(false);
    }
  };

  const hasActiveSubscription =
    hasStripeManagedSubscription(subscription) || status === 'success';

  const planName = paymentPlanLabel(subscription?.plan ?? null);

  if (isSubscriptionPending) {
    return (
      <div className="mx-auto flex h-full min-h-48 flex-col items-center justify-center rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
        <Spinner className="size-8 text-muted-foreground" />
        <p className="mt-3 typo-body-sm text-muted-foreground">
          Abo wird geladen…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <PaymentPlanDisplay
        hasActiveSubscription={hasActiveSubscription}
        planName={planName}
        trialEndsAt={trialEndsAt}
        showPastDueNotice={subscription?.status === 'past_due'}
        pendingPriceId={pendingPriceId}
        isPortalLoading={isPortalLoading}
        onSubscribe={handleSubscribe}
        onManageBilling={handleManageBilling}
      />
    </div>
  );
}

export default Payments;
