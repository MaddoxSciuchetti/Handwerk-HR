import { LANDING_CONTACT } from './contactDetails';

export function LandingBrand() {
  return (
    <header>
      <h1 className="text-5xl font-medium tracking-tight">
        {LANDING_CONTACT.brand}
      </h1>
      <p className="mt-4 text-base font-normal leading-snug tracking-tight text-black/75">
        {LANDING_CONTACT.slogan}
      </p>
      <p className="mt-8 max-w-sm text-sm font-normal leading-relaxed text-black/65">
        {LANDING_CONTACT.about}
      </p>
    </header>
  );
}
