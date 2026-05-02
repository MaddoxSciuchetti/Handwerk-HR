export type PaymentPlan = {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: string;
  lookupKey: string;
};

export const PAYMENT_PLANS: readonly PaymentPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '20 € / Monat',
    lookupKey: 'starter_monthly',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '50 € / Monat',
    lookupKey: 'pro_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Auf Anfrage',
    lookupKey: 'enterprise_monthly',
  },
] as const;
