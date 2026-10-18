export type BillingSubscription = {
  id: string;
  organizationId: string;
  plan: 'starter' | 'pro' | 'enterprise' | null;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  hasStripeSubscription?: boolean;
};

export type BillingInvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

export type BillingInvoice = {
  id: string;
  number: string | null;
  amountCents: number;
  currency: string;
  status: BillingInvoiceStatus;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  paidAt: string | null;
  dueDate: string | null;
  createdAt: string;
};
