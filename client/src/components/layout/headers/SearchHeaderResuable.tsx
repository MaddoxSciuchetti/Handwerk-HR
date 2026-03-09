import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SearchHeaderResuableProps<T extends string | number> = {
  search?: T;
  setSearch?: (value: T) => void;
  description: string;
  toggleModal: () => void;
};

const SearchHeaderResuable = <T extends string | number>({
  search,
  setSearch,
  toggleModal,
  description,
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
            onClick={() => toggleModal()}
            className="cursor-pointer rounded-xl hover:bg-gray-200"
          >
            {description}
          </Button>
        </div>
      </div>
    </>
  );
};

export default SearchHeaderResuable;
