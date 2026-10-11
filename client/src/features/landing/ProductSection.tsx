import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const STEPS = [
  {
    title: 'Collect the person once',
    detail:
      'Before the first day you send a questionnaire. The answers and the documents come back onto the employee. The employment contract is filled from those answers, so the name, the role, and the dates are written once.',
  },
  {
    title: 'Open the workplace',
    detail:
      'The signed contract is the signal that this person is joining. Hadox can then create the Microsoft 365 account, with mail and Teams, and the ENGINE4 user. It can order materials and workwear, and send the team a welcome mail.',
  },
  {
    title: 'Close the employment',
    detail:
      'Leaving stays on the same record. Equipment comes back, the mailbox can be forwarded, and Microsoft 365, ENGINE4, and Crewmeister access can be turned off. The team gets a departure note, and the reference letter goes out from the stored template.',
  },
] as const;

export function ProductSection() {
  return (
    <section
      id="product"
      className="mx-auto w-full max-w-5xl px-6 py-12"
    >
      <h2 className="text-3xl font-medium tracking-tight">What Hadox does</h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        One person, one record, three parts of the job. Hadox follows the
        hire from the questionnaire to the workplace, and later from the
        workplace to the goodbye.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {step.detail}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
