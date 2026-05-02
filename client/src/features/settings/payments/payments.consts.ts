export type PaymentPlan = {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: string;
  /** Stripe Price ID (e.g. price_1TSekY...) */
  priceId: string;
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
