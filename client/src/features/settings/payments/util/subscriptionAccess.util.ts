import type { BillingSubscription } from '../billing.types';

export function hasStripeManagedSubscription(
  s: BillingSubscription | null | undefined
): boolean {
  if (!s?.stripeSubscriptionId) return false;
  return (
    s.status === 'active' || s.status === 'past_due' || s.status === 'trialing'
  );
}

export function hasSubscriptionAppAccess(
  s: BillingSubscription | null | undefined
): boolean {
  if (!s) return true;
  if (s.status === 'cancelled') return false;
  if (s.status === 'past_due') return false;
  if (s.status === 'active') return true;
  if (s.status === 'trialing' && s.stripeSubscriptionId) return true;
  if (s.status === 'trialing' && !s.stripeSubscriptionId) {
    if (!s.trialEndsAt) return true;
    return new Date(s.trialEndsAt) > new Date();
  }
  return false;
}

export function isSubscriptionLocked(
  s: BillingSubscription | null | undefined
): boolean {
  return !hasSubscriptionAppAccess(s);
}
