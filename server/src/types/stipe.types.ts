export type StripeSubscriptionResource = {
    id: string;
    status: string;
    customer: string | { id?: string | null } | null;
    current_period_start: number;
    current_period_end: number;
    trial_end: number | null;
    metadata: Record<string, string> | null;
    default_payment_method?:
        | string
        | {
              id?: string;
              type?: string;
              card?: {
                  brand: string;
                  last4: string;
                  exp_month: number;
                  exp_year: number;
              };
          }
        | null;
    items: {
        data: Array<{
            price: string | { id?: string; lookup_key?: string | null } | null;
        }>;
    };
};
