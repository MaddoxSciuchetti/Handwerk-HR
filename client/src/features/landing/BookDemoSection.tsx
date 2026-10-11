import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent } from 'react';

const DEMO_EMAIL = 'maddoxsciuchetti@gmail.com';

type DemoFieldProps = {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
};

function DemoField({ id, label, type = 'text', required = true }: DemoFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} required={required} />
    </div>
  );
}

export function BookDemoSection() {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '');
    const email = String(data.get('email') ?? '');
    const company = String(data.get('company') ?? '');
    const when = String(data.get('when') ?? '');
    const body = `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nPreferred time: ${when}`;
    const href = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent('Hadox demo')}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <section id="demo" className="mx-auto w-full max-w-5xl px-6 py-12">
      <h2 className="text-3xl font-medium tracking-tight">Book a demo</h2>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
        Tell us when to walk through a hire and a departure on your own
        checklist.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-6 grid max-w-xl gap-4"
      >
        <DemoField id="name" label="Name" />
        <DemoField id="email" label="Work email" type="email" />
        <DemoField id="company" label="Company" />
        <DemoField id="when" label="Preferred time" type="datetime-local" />
        <div>
          <Button type="submit">Book a demo</Button>
        </div>
      </form>
    </section>
  );
}
