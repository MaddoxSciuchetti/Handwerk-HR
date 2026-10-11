import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { scrollToSection } from './scrollToSection';

export function LandingHero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="max-w-2xl text-4xl font-medium tracking-tight">
        One checklist from the first day to the last.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        A trades company hires someone, sets up their workplace, and one day
        sees them leave. Hadox keeps that whole path on one employee record.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={() => scrollToSection('demo')}>
          Book a demo
        </Button>
        <Button variant="outline" asChild>
          <Link to="/signup">Create account</Link>
        </Button>
      </div>
    </section>
  );
}
