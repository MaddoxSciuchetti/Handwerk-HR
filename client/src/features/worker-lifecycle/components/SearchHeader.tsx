import { Button } from './ui/button';
import { Input } from './ui/input';
type SearchHeaderProps = {
  search: string;
  setSearch: (value: string) => void;
  toggleModal: () => void;
};

function SearchHeader({ search, setSearch, toggleModal }: SearchHeaderProps) {
  return (
    <div className="flex gap-5">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suche bei Namen"
      />
      <div className="flex gap-2 ">
        <Button
          variant={'outline'}
          onClick={() => toggleModal()}
          className="cursor-pointer"
        >
          Handwerker hinzufügen
        </Button>
      </div>
    </div>
  );
}
export default SearchHeader;
