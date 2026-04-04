import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/trycatch';

type SearchHeaderResuableProps<T extends string | number> = {
  search?: T;
  setSearch?: (value: T) => void;
  description?: string;
  openModal?: () => void;
  action?: () => void;
  className?: string;
  /** Tighter layout for dense pages (e.g. templates list). */
  compact?: boolean;
};

const SearchHeaderResuable = <T extends string | number>({
  search,
  setSearch,
  openModal,
  description,
  action,
  className,
  compact,
}: SearchHeaderResuableProps<T>) => {
  const buttonLabel = description?.trim();

  return (
    <search
      aria-label="Aufgaben suchen"
      className={cn('flex', compact ? 'gap-2' : 'gap-5', className)}
    >
      <Label htmlFor="employee-search" className="sr-only">
        Suche bei Namen
      </Label>
      <Input
        id="employee-search"
        value={search}
        onChange={(e) => setSearch?.(e.target.value as T)}
        className={cn(compact ? 'h-8 rounded-lg text-sm' : 'rounded-xl')}
        placeholder="Suche bei Namen"
      />
      <Button
        variant={'outline'}
        data-testid={buttonLabel}
        onClick={(e) => {
          e.stopPropagation();
          action?.();
          openModal?.();
        }}
        className={cn(
          'cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground hover:bg-[var(--hover-bg)] hover:text-[var(--hover-foreground)]',
          compact
            ? 'h-8 shrink-0 rounded-lg px-3 text-sm'
            : 'rounded-xl'
        )}
      >
        {description}
      </Button>
    </search>
  );
};

export default SearchHeaderResuable;
