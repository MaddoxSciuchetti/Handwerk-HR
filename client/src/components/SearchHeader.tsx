import { Button } from "./ui/button";
import { Input } from "./ui/input";

type SearchHeaderProps = {
    search: string;
    setSearch: (value: string) => void;
    toggleModal: () => void;
};

function SearchHeader({ search, setSearch, toggleModal }: SearchHeaderProps) {
    return (
        <div className="flex items-center gap-4 mb-6">
            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suche bei Namen"
            />
            <div className="flex gap-2">
                <Button variant={"outline"} onClick={() => toggleModal()}>
                    Mitarbeiter hinzufügen?
                </Button>
            </div>
        </div>
    );
}
export default SearchHeader;
