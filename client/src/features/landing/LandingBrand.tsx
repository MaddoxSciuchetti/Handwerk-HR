import { LANDING_CONTACT } from './contactDetails';

export function LandingBrand() {
  return (
    <header>
      <h1 className="text-5xl font-medium tracking-tight">
        {LANDING_CONTACT.brand}
      </h1>
      <p className="mt-4 text-base font-normal leading-snug tracking-tight text-muted-foreground">
        {LANDING_CONTACT.slogan}
      </p>
      <div className="mt-8 max-w-sm">
        <p className="text-sm font-medium tracking-tight">
          {LANDING_CONTACT.howItWorksTitle}
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-normal leading-relaxed text-muted-foreground">
          {LANDING_CONTACT.howItWorksSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </header>
  );
}
