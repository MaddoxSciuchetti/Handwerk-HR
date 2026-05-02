import { Table } from '@/components/ui/selfmade/table/Table';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PlanRow } from './PlanRow';
import { SubscriptionRow } from './SubscriptionRow';
import { createCheckoutSession, createPortalSession } from './payments.api';
import { PAYMENT_PLANS } from './payments.consts';
import { usePaymentRedirect } from './usePaymentRedirect';

function Payments() {
  const { status, sessionId } = usePaymentRedirect();
  const [pendingLookupKey, setPendingLookupKey] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      toast.success('Abo erfolgreich aktiviert.');
    } else if (status === 'canceled') {
      toast.info('Bezahlvorgang abgebrochen.');
    }
  }, [status]);

  const handleSubscribe = async (lookupKey: string) => {
    try {
      setPendingLookupKey(lookupKey);
      const { url } = await createCheckoutSession(lookupKey);
      window.location.href = url;
    } catch {
      toast.error('Checkout konnte nicht gestartet werden.');
      setPendingLookupKey(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsPortalLoading(true);
      const { url } = await createPortalSession(sessionId ?? undefined);
      window.location.href = url;
    } catch {
      toast.error('Kundenportal konnte nicht geöffnet werden.');
      setIsPortalLoading(false);
    }
  };

  const hasActiveSubscription = status === 'success';

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex w-200 flex-col items-start">
          <h1 className="typo-h4 font-bold">Zahlungen</h1>
          <p className="typo-body-sm text-muted-foreground">
            {hasActiveSubscription
              ? 'Verwalte dein Abo und deine Zahlungsmethoden.'
              : 'Wähle einen Plan, um dein Abo zu starten.'}
          </p>
        </div>
        <Table className="w-200">
          {hasActiveSubscription ? (
            <SubscriptionRow
              planName="Starter"
              isLoading={isPortalLoading}
              onChangePaymentMethod={handleManageBilling}
            />
          ) : (
            PAYMENT_PLANS.map((plan) => (
              <PlanRow
                key={plan.id}
                name={plan.name}
                price={plan.price}
                isLoading={pendingLookupKey === plan.lookupKey}
                onSubscribe={() => handleSubscribe(plan.lookupKey)}
              />
            ))
          )}
        </Table>
      </div>
    </div>
  );
}

export default Payments;
