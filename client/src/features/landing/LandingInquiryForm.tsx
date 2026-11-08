import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormEvent } from 'react';
import { LANDING_CONTACT } from './contactDetails';

const fieldClassName =
  'rounded-lg border-black/25 bg-white text-sm font-normal text-black shadow-none placeholder:text-black/35 focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/20';

export function LandingInquiryForm() {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const body = `E-Mail: ${email}\n\nAnfrage:\n${message}`;
    const href = `mailto:${LANDING_CONTACT.email}?subject=${encodeURIComponent('Hadox Anfrage')}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <section aria-label="Anfrage" className="w-full md:pt-1">
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="grid gap-2">
          <Label
            htmlFor="landing-email"
            className="text-xs font-normal text-black/55"
          >
            E-Mail
          </Label>
          <Input
            id="landing-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`h-11 px-3.5 ${fieldClassName}`}
          />
        </div>
        <div className="grid gap-2">
          <Label
            htmlFor="landing-message"
            className="text-xs font-normal text-black/55"
          >
            Anfrage
          </Label>
          <Textarea
            id="landing-message"
            name="message"
            required
            rows={5}
            placeholder="Kurz Ihr Anliegen oder Ihr Unternehmen beschreiben"
            className={`min-h-32 px-3.5 py-3 ${fieldClassName}`}
          />
        </div>
        <div className="pt-1">
          <Button
            type="submit"
            className="h-11 rounded-full border border-black bg-black px-8 text-sm font-medium text-white hover:bg-white hover:text-black"
          >
            Senden
          </Button>
        </div>
      </form>
    </section>
  );
}
