import { LANDING_CONTACT } from './contactDetails';

export function LandingImpressum() {
  return (
    <footer className="mt-16 border-t border-black/10 pt-5 text-[11px] font-normal leading-relaxed text-black/45 sm:mt-20">
      <p>
        <span className="font-medium text-black/55">Impressum</span>
        {' · '}
        {LANDING_CONTACT.addressLines.join(', ')}
        {' · '}
        Inhaber: {LANDING_CONTACT.name}
      </p>
    </footer>
  );
}
