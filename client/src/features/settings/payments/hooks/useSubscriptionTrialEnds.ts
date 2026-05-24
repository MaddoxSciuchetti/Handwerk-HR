import { useBillingSubscription } from './useBillingSubscription';

export function useSubscriptionTrialEnds() {
  const query = useBillingSubscription();
  return {
    trialEndsAt: query.data?.trialEndsAt ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    subscription: query.data,
  };
}
