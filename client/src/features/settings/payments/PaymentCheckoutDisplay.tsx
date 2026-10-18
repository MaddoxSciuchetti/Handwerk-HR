import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody } from '@/components/ui/table';
import type { ReactNode } from 'react';
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
  children?: ReactNode;
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
  children,
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
    <section className="flex w-full flex-col items-stretch">
      <div className="flex w-full flex-col items-start gap-1">
        <SettingsPageHeader title="Zahlungen" />
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
      <Card className="mt-5 w-full gap-0 border border-border py-0 shadow-none ring-0">
        <CardContent className="px-2 py-2">
          <Table>
            <TableBody className="[&_tr]:border-0 [&_td]:px-2 [&_td]:py-4 [&_td:first-child]:pl-10">
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {children}
    </section>
  );
}
