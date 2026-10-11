import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';
import type { LandingPlan } from './plans';

type PlanCardProps = {
  plan: LandingPlan;
};

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <Card
      className={plan.highlighted ? 'bg-muted ring-foreground/20' : undefined}
    >
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.heading}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-medium tracking-tight">
          {plan.price}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / month
          </span>
        </p>
        <ul className="mt-4 space-y-2">
          {plan.includes.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed">
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
