import { Table } from '@/features/settings/components/Table';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { Link } from '@tanstack/react-router';
import { PlanRow } from './PlanRow';
import { SubscriptionRow } from './SubscriptionRow';
import { PAYMENT_PLANS } from './payments.consts';
import { trialDaysRemainingLabel } from './util/trial.util';

type PaymentPanDisplayProps = {
  hasActiveSubscription: boolean;
  planName: string;
  trialEndsAt: string | null;
  showPastDueNotice?: boolean;
  pendingPriceId: string | null;
  isPortalLoading?: boolean;
  onSubscribe: (priceId: string) => void;
  onManageBilling: () => void;
};

export function PaymentPlanDisplay({
  hasActiveSubscription,
  planName,
  trialEndsAt,
  showPastDueNotice = false,
  pendingPriceId,
  isPortalLoading = false,
  onSubscribe,
  onManageBilling,
}: PaymentPanDisplayProps) {
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
        <SettingsPageHeader
          title="Zahlungen"
          description={
            hasActiveSubscription
              ? 'Verwalte dein Abo und deine Zahlungsmethoden.'
              : 'Wähle einen Plan, um dein Abo zu starten.'
          }
        />
        {showPastDueNotice ? (
          <p className="typo-body-sm font-medium text-destructive">
            Die letzte Zahlung ist fehlgeschlagen. Bitte aktualisiere deine
            Zahlungsmethode oder dein Abo im Kundenportal.
          </p>
        ) : null}
        {trialDaysLine ? (
          <p className="typo-body-sm font-medium text-foreground">
            {trialDaysLine}
          </p>
        ) : null}
        {trialEndFormatted ? (
          <p className="typo-body-sm text-muted-foreground">
            Endet am {trialEndFormatted}
          </p>
        ) : null}
        <Link
          to="/settings/plans"
          className="typo-body-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Pläne vergleichen
        </Link>
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
