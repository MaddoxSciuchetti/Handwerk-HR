import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SearchHeaderResuableProps<T extends string | number> = {
  search?: T;
  setSearch?: (value: T) => void;
  description: string;
  openModal: () => void;
  action?: () => void;
};

const SearchHeaderResuable = <T extends string | number>({
  search,
  setSearch,
  openModal,
  description,
  action,
}: SearchHeaderResuableProps<T>) => {
  const buttonLabel = description.trim();

  return (
    <search aria-label="Aufgaben suchen" className="flex gap-5">
      <Label htmlFor="employee-search" className="sr-only">
        Suche bei Namen
      </Label>
      <Input
        id="employee-search"
        value={search}
        onChange={(e) => setSearch?.(e.target.value as T)}
        className="rounded-xl"
        placeholder="Suche bei Namen"
      />
      <Button
        variant={'outline'}
        data-testid={buttonLabel}
        onClick={(e) => {
          e.stopPropagation();
          action?.();
          openModal();
        }}
        className="cursor-pointer rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors hover:bg-(--hover-bg) hover:text-(--hover-foreground)"
      >
        {description}
      </Button>
    </search>
  );
};

export default SearchHeaderResuable;
