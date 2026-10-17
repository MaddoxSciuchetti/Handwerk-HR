import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { scrollToSection } from './scrollToSection';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          className="h-auto px-0 text-sm font-medium tracking-tight hover:bg-transparent hover:text-foreground"
          onClick={() => scrollToSection('top')}
        >
          Hadox
        </Button>
        <nav className="flex items-center gap-2" aria-label="Page">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => scrollToSection('product')}
          >
            Product
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => scrollToSection('plans')}
          >
            Plans
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() => scrollToSection('demo')}
          >
            Book a demo
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
