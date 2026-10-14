import { LANDING_PLANS } from './plans';
import { PlanCard } from './PlanCard';

export function PlanSection() {
  return (
    <section id="plans" className="mx-auto w-full max-w-5xl px-6 py-12">
      <h2 className="text-3xl font-medium tracking-tight">Plans</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {LANDING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </section>
  );
}
