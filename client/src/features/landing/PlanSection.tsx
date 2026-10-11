import { LANDING_PLANS } from './plans';
import { PlanCard } from './PlanCard';

export function PlanSection() {
  return (
    <section
      id="plans"
      className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-5xl px-6 pt-8 pb-24"
    >
      <h2 className="text-3xl font-medium tracking-tight">Plans</h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        The checklist is the same on every plan. The price is how much of
        that path Hadox runs for you: the record itself, AI on the record, or
        integrations built around it.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {LANDING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </section>
  );
}
