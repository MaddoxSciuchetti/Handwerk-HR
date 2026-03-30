import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type EmployeeSearchHeaderProps = {
  search: string;
  setSearch: (value: string) => void;
};

const EmployeeSearchHeader = ({
  search,
  setSearch,
}: EmployeeSearchHeaderProps) => {
  return (
    <search aria-label="Mitarbeiter suchen">
      <Label htmlFor="employee-search" className="sr-only">
        Suche bei Namen
      </Label>
      <Input
        id="employee-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-xl"
        placeholder="Suche bei Namen"
      />
    </search>
  );
};

export default EmployeeSearchHeader;
