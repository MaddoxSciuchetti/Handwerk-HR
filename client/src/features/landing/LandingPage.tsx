import { useEffect } from 'react';
import { BookDemoSection } from './BookDemoSection';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { PlanSection } from './PlanSection';
import { ProductSection } from './ProductSection';

export function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Hadox';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div id="top" className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      <LandingHero />
      <ProductSection />
      <PlanSection />
      <BookDemoSection />
    </div>
  );
}
