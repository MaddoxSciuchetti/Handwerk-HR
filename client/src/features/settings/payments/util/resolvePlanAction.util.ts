import { PaymentPlan, PLAN_TIER_ORDER } from '../payments.consts';

type PlanAction = {
  kind: 'checkout' | 'portal';
  label: string;
};

export function resolvePlanAction(
  plan: PaymentPlan,
  hasActiveSub: boolean,
  currentPlanId: string | null | undefined
): PlanAction {
  if (!hasActiveSub) {
    return { kind: 'checkout', label: 'Abonnieren' };
  }

  if (!currentPlanId || !(currentPlanId in PLAN_TIER_ORDER)) {
    return { kind: 'portal', label: 'Im Kundenportal wählen' };
  }

  const current = currentPlanId as PaymentPlan['id'];
  if (plan.id === current) {
    return { kind: 'portal', label: 'Verwalten & verlängern' };
  }
  if (PLAN_TIER_ORDER[plan.id] > PLAN_TIER_ORDER[current]) {
    return { kind: 'portal', label: 'Upgrade' };
  }
  return { kind: 'portal', label: 'Herunterstufen' };
}
