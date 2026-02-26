import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type HeaderProps = {
  toggleModal: () => void;
};

const Header = ({ toggleModal }: HeaderProps) => {
  return (
    <>
      <div className="flex gap-5">
        <Input placeholder="Suche bei Namen" />
        <div className="flex gap-2">
          <Button
            className="cursor-pointer"
            onClick={toggleModal}
            variant={'outline'}
          >
            Mitarbeiter Hinzufügen
          </Button>
        </div>
      </div>
    </>
  );
};

export default Header;
