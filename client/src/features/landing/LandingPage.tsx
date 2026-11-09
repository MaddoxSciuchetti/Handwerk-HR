import { useEffect } from 'react';
import { LandingBrand } from './LandingBrand';
import { LandingImpressum } from './LandingImpressum';
import { LandingInquiryForm } from './LandingInquiryForm';

export function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'HADOX';

    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');

    return () => {
      document.title = previousTitle;
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div className="landing-page min-h-dvh bg-background text-foreground antialiased [&_*]:[font-family:'Inter_Variable',Inter,sans-serif]">
      <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center px-6 py-14 sm:px-10 sm:py-20">
        <main className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
          <LandingBrand />
          <LandingInquiryForm />
        </main>
        <LandingImpressum />
      </div>
    </div>
  );
}
