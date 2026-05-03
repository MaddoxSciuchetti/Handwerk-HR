import { Table } from '@/components/ui/selfmade/table/Table';
import { PlanRow } from './PlanRow';
import { SubscriptionRow } from './SubscriptionRow';
import { PAYMENT_PLANS } from './payments.consts';
import { trialDaysRemainingLabel } from './trialUtils';

type PaymentCheckoutDisplayProps = {
  hasActiveSubscription: boolean;
  planName: string;
  trialEndsAt: string | null;
  /** Stripe could not collect payment — user should fix method in portal. */
  showPastDueNotice?: boolean;
  pendingPriceId: string | null;
  isPortalLoading?: boolean;
  onSubscribe: (priceId: string) => void;
  onManageBilling: () => void;
};

export function PaymentCheckoutDisplay({
  hasActiveSubscription,
  planName,
  trialEndsAt,
  showPastDueNotice = false,
  pendingPriceId,
  isPortalLoading = false,
  onSubscribe,
  onManageBilling,
}: PaymentCheckoutDisplayProps) {
  const showTrial = Boolean(trialEndsAt) && !hasActiveSubscription;
  const trialEndFormatted =
    showTrial && trialEndsAt
      ? new Date(trialEndsAt).toLocaleDateString('de-DE', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        })
      : null;

  const trialDaysLine = showTrial ? trialDaysRemainingLabel(trialEndsAt) : null;

  return (
    <section className="flex h-full w-full flex-col items-center justify-center">
      <div className="flex w-200 flex-col items-start gap-1">
        <h1 className="typo-h4 font-bold">Zahlungen</h1>
        <p className="typo-body-sm text-muted-foreground">
          {hasActiveSubscription
            ? 'Verwalte dein Abo und deine Zahlungsmethoden.'
            : 'Wähle einen Plan, um dein Abo zu starten.'}
        </p>
        {showPastDueNotice ? (
          <p className="typo-body-sm font-medium text-destructive">
            Die letzte Zahlung ist fehlgeschlagen. Bitte aktualisiere deine
            Zahlungsmethode oder dein Abo im Kundenportal.
          </p>
        ) : null}
        {trialDaysLine ? (
          <p className="typo-body-sm font-medium text-foreground">{trialDaysLine}</p>
        ) : null}
        {trialEndFormatted ? (
          <p className="typo-body-sm text-muted-foreground">
            Endet am {trialEndFormatted}
          </p>
        ) : null}
      </div>
      <Table className="w-200">
        {hasActiveSubscription ? (
          <SubscriptionRow
            planName={planName}
            isLoading={isPortalLoading}
            onChangePaymentMethod={onManageBilling}
          />
        ) : (
          PAYMENT_PLANS.map((plan) => (
            <PlanRow
              key={plan.id}
              name={plan.name}
              price={plan.price}
              isLoading={pendingPriceId === plan.priceId}
              onSubscribe={() => onSubscribe(plan.priceId)}
            />
          ))
        )}
      </Table>
    </section>
  );
}
