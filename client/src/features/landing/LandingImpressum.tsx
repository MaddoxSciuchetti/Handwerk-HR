import { useEffect, useState } from 'react';
import { LANDING_CONTACT } from './contactDetails';

function hashIsImpressum() {
  return typeof window !== 'undefined' && window.location.hash === '#impressum';
}

export function LandingImpressum() {
  const [open, setOpen] = useState(hashIsImpressum);

  useEffect(() => {
    if (!open) return;
    if (window.location.hash !== '#impressum') {
      window.history.replaceState(null, '', '#impressum');
    }
    document.getElementById('impressum')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [open]);

  const onToggle = () => {
    setOpen((current) => {
      const next = !current;
      if (!next && window.location.hash === '#impressum') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return next;
    });
  };

  return (
    <footer
      id="impressum"
      className="mt-16 border-t border-border pt-6 text-xs font-normal leading-relaxed text-muted-foreground sm:mt-20"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="impressum-details"
        onClick={onToggle}
        className="font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Impressum
      </button>
      {open ? (
        <div id="impressum-details" className="mt-4">
          <p>Angaben gemäß § 5 DDG</p>
          <div className="mt-3 space-y-0.5">
            <p>{LANDING_CONTACT.name}</p>
            {LANDING_CONTACT.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="mt-3 space-y-0.5">
            <p>Telefon: {LANDING_CONTACT.phone}</p>
            <p>
              E-Mail:{' '}
              <a
                href={LANDING_CONTACT.emailHref}
                className="underline-offset-4 hover:underline"
              >
                {LANDING_CONTACT.email}
              </a>
            </p>
          </div>
          <p className="mt-3">Kleinunternehmer gemäß § 19 UStG</p>
        </div>
      ) : null}
    </footer>
  );
}
