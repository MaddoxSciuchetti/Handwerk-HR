export type PaymentPlan = {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: string;
  priceId: string;
};

export const PLAN_TIER_ORDER: Record<PaymentPlan['id'], number> = {
  starter: 0,
  pro: 1,
  enterprise: 2,
};

export const PAYMENT_PLANS: readonly PaymentPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '10 € / Monat',
    priceId: 'price_1TSLW4IFABFY32sSl8hcCUBE',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '30 € / Monat',
    priceId: 'price_1TSekOIFABFY32sSYamWuX2h',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Auf Anfrage',
    priceId: 'price_1TSekYIFABFY32sS3XsLPgIW',
  },
] as const;

export function paymentPlanLabel(planId: string | null): string {
  if (!planId) return 'Abo';
  const p = PAYMENT_PLANS.find((x) => x.id === planId);
  return p?.name ?? planId;
}
