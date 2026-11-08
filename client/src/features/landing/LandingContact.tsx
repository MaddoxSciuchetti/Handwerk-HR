import { LANDING_CONTACT } from './contactDetails';

export function LandingContact() {
  return (
    <section aria-label="Kontakt" className="space-y-2">
      <p className="text-sm font-medium tracking-tight">
        {LANDING_CONTACT.name}
      </p>
      <p className="text-sm font-normal text-black/70">
        <a
          href={LANDING_CONTACT.phoneHref}
          className="underline-offset-4 hover:underline"
        >
          {LANDING_CONTACT.phone}
        </a>
      </p>
      <p className="text-sm font-normal text-black/70">
        <a
          href={LANDING_CONTACT.emailHref}
          className="underline-offset-4 hover:underline"
        >
          {LANDING_CONTACT.email}
        </a>
      </p>
    </section>
  );
}
