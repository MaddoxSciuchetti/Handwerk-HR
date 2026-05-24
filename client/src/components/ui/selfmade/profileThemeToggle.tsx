import { cn } from '@/lib/trycatch';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

export function ProfileThemeToggle({
  theme,
  setTheme,
  onDone,
}: {
  theme: Theme;
  setTheme: (next: Theme) => void;
  onDone: () => void;
}) {
  return (
    <div
      className="mt-1.5 w-full min-w-0 px-0.5"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      role="group"
      aria-label="Erscheinungsbild"
    >
      <div className="flex w-full min-w-0 rounded-full bg-muted p-px">
        <button
          type="button"
          aria-pressed={theme === 'light'}
          aria-label="Helles Design"
          className={cn(
            'flex min-h-7 min-w-0 flex-1 basis-0 items-center justify-center rounded-full py-1 transition-colors',
            theme === 'light'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => {
            setTheme('light');
            onDone();
          }}
        >
          <Sun className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={theme === 'dark'}
          aria-label="Dunkles Design"
          className={cn(
            'flex min-h-7 min-w-0 flex-1 basis-0 items-center justify-center rounded-full py-1 transition-colors',
            theme === 'dark'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => {
            setTheme('dark');
            onDone();
          }}
        >
          <Moon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
