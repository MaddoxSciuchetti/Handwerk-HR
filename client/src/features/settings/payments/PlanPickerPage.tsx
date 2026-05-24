import { Spinner } from '@/components/ui/spinner';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBillingSubscription } from './hooks/useBillingSubscription';
import {
  createBillingPortalSession,
  createCheckoutSession,
} from './payments.api';
import { PAYMENT_PLANS, type PaymentPlan } from './payments.consts';
import { PlanPickerCard } from './PlanPickerCard';
import { usePaymentRedirect } from './usePaymentRedirect';
import { resolvePlanAction } from './util/resolvePlanAction.util';
import { hasStripeManagedSubscription } from './util/subscriptionAccess.util';

function PlanPickerPage() {
  const { status } = usePaymentRedirect();
  const { data: subscription, isPending } = useBillingSubscription();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [portalLoadingPlanId, setPortalLoadingPlanId] = useState<
    PaymentPlan['id'] | null
  >(null);

  const hasActiveSub =
    hasStripeManagedSubscription(subscription) || status === 'success';
  const currentPlanId = subscription?.plan ?? null;

  /** Uses existing `POST /billing/checkout` via `createCheckoutSession`. */
  const runCheckout = async (priceId: string) => {
    try {
      setLoadingPriceId(priceId);
      const { url } = await createCheckoutSession(priceId);
      window.location.assign(url);
    } catch {
      toast.error('Checkout konnte nicht gestartet werden.');
      setLoadingPriceId(null);
    }
  };

  const runPortal = async (planId: PaymentPlan['id']) => {
    try {
      setPortalLoadingPlanId(planId);
      const { url } = await createBillingPortalSession();
      window.location.assign(url);
    } catch {
      toast.error('Kundenportal konnte nicht geöffnet werden.');
      setPortalLoadingPlanId(null);
    }
  };

  if (isPending) {
    return (
      <div className="mx-auto flex min-h-48 w-full max-w-5xl flex-col items-center justify-center rounded-2xl bg-card p-6">
        <Spinner className="size-8 text-muted-foreground" />
        <p className="mt-3 typo-body-sm text-muted-foreground">
          Abo wird geladen…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl bg-card p-6 text-card-foreground md:p-8">
      <header className="flex flex-col gap-2">
        <Link
          to="/settings/payments"
          className="typo-caption w-fit text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Zurück zu Zahlungen
        </Link>
        <h1 className="typo-h4 font-bold">Pläne</h1>
        <p className="typo-body-sm text-muted-foreground">
          {hasActiveSub
            ? 'Planwechsel, Verlängerung und Zahlung verwaltest du im Kundenportal.'
            : 'Wähle den passenden Plan für dein Team.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {PAYMENT_PLANS.map((plan) => {
          const action = resolvePlanAction(plan, hasActiveSub, currentPlanId);
          const isCurrent = Boolean(
            hasActiveSub && currentPlanId && plan.id === currentPlanId
          );
          const isThisCheckoutLoading =
            action.kind === 'checkout' && loadingPriceId === plan.priceId;
          const isThisPortalLoading =
            action.kind === 'portal' && portalLoadingPlanId === plan.id;
          const primaryLoading = isThisCheckoutLoading || isThisPortalLoading;

          const busyElsewhere =
            (loadingPriceId !== null && !isThisCheckoutLoading) ||
            (portalLoadingPlanId !== null && !isThisPortalLoading);

          const onPrimary = () => {
            if (action.kind === 'checkout') {
              void runCheckout(plan.priceId);
            } else {
              void runPortal(plan.id);
            }
          };

          return (
            <PlanPickerCard
              key={plan.id}
              name={plan.name}
              price={plan.price}
              isCurrent={isCurrent}
              primaryLabel={action.label}
              onPrimary={onPrimary}
              primaryLoading={primaryLoading}
              primaryDisabled={busyElsewhere}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PlanPickerPage;
