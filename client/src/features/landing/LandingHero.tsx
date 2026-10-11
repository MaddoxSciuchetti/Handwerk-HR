import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export function LandingHero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="max-w-2xl text-4xl font-medium tracking-tight">
        One checklist from the first day to the last.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        A trades company hires someone, sets up their workplace, and one day
        sees them leave. Hadox keeps that whole path on one employee record.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link to="/signup">Create account</Link>
        </Button>
      </div>
    </section>
  );
}
