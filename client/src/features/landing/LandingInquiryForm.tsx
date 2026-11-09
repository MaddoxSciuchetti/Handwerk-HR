import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiJson } from '@/config/apiClient';
import { FormEvent, useState } from 'react';

export function LandingInquiryForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const companyWebsite = String(data.get('companyWebsite') ?? '').trim();

    setPending(true);
    setError(null);
    setSent(false);

    try {
      await apiJson.post('/contact/inquiry', {
        email,
        message,
        companyWebsite,
      });
      setSent(true);
      form.reset();
    } catch {
      setError(
        'Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setPending(false);
    }
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
            disabled={pending}
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
            disabled={pending}
            placeholder="Beschreiben Sie kurz Ihr Anliegen"
            className="min-h-32 resize-none rounded-lg"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute left-[-10000px] h-0 w-0 overflow-hidden"
        >
          <Label htmlFor="landing-company-website">Website</Label>
          <Input
            id="landing-company-website"
            name="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {sent ? (
          <p className="text-sm text-muted-foreground" role="status">
            Danke — Ihre Anfrage wurde gesendet.
          </p>
        ) : null}
        <div className="pt-1">
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="rounded-full px-8 transition-opacity hover:opacity-80"
          >
            {pending ? 'Wird gesendet…' : 'Senden'}
          </Button>
        </div>
      </form>
    </section>
  );
}
