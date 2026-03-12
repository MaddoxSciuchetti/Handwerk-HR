import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SearchHeaderResuableProps<T extends string | number> = {
  search?: T;
  setSearch?: (value: T) => void;
  description: string;
  toggleModal: () => void;
  action?: () => void;
};

const SearchHeaderResuable = <T extends string | number>({
  search,
  setSearch,
  toggleModal,
  description,
  action,
}: SearchHeaderResuableProps<T>) => {
  return (
    <>
      <div className="flex gap-5">
        <Input
          value={search}
          onChange={(e) => setSearch?.(e.target.value as T)}
          className="rounded-xl"
          placeholder="Suche bei Namen"
        />
        <div className="flex gap-2 ">
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              action?.();
              toggleModal();
            }}
            className="cursor-pointer rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors hover:bg-(--hover-bg) hover:text-(--hover-foreground)"
          >
            {description}
          </Button>
        </div>
      </div>
    </>
  );
};

export default SearchHeaderResuable;
