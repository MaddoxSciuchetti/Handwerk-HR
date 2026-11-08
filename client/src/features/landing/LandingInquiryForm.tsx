import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormEvent } from 'react';
import { LANDING_CONTACT } from './contactDetails';

export function LandingInquiryForm() {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const body = `E-Mail: ${email}\n\nAnliegen:\n${message}`;
    const href = `mailto:${LANDING_CONTACT.email}?subject=${encodeURIComponent('Hadox Anfrage')}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <section aria-label="Anfrage" className="w-full md:pt-1">
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="landing-email">E-Mail</Label>
          <Input
            id="landing-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-10 rounded-lg"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="landing-message">Anliegen</Label>
          <Textarea
            id="landing-message"
            name="message"
            required
            rows={5}
            placeholder="Beschreiben Sie kurz Ihr Anliegen"
            className="min-h-32 rounded-lg"
          />
        </div>
        <div className="pt-1">
          <Button
            type="submit"
            size="lg"
            className="rounded-full px-8 transition-opacity hover:opacity-80"
          >
            Senden
          </Button>
        </div>
      </form>
    </section>
  );
}
