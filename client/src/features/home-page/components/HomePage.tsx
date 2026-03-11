import '@/App.css';
import { Link } from '@tanstack/react-router';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <span className="text-xl font-semibold tracking-tight">
            OnboardOffboard
          </span>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-16">
          <article>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Happy employees drive successful companies.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70 sm:text-xl">
              Our platform helps you deliver an unforgettable onboarding
              experience
            </p>

            <nav
              aria-label="Primary actions"
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/signup"
                className="inline-flex h-11 items-center hover:bg-(--secondary) justify-center  border rounded-md bg-foreground px-8 text-base font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex h-11 items-center hover:bg-(--secondary) justify-center rounded-md border border-foreground/25 bg-transparent px-8 text-base font-medium transition-colors hover:bg-foreground/10"
              >
                Sign In
              </Link>
            </nav>
          </article>

          <figure className="relative h-72 overflow-hidden rounded-xl border border-border/60 sm:h-96 lg:h-135">
            <img
              src="https://assets.adac.de/image/upload/ar_16:9,c_fill,f_auto,g_auto,q_auto:eco,w_1500/v1/ADAC-eV/KOR/Bilder/RM/bundestagswahl-infrastruktur-verkehr-generalsanierung-2501_pazqna.jpeg"
              alt="Team onboarding workshop in a modern office"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </figure>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
