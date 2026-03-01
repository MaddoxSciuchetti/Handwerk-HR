import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PageHeaderProps = {
  openCreate: () => void;
};

const PageHeader = ({ openCreate }: PageHeaderProps) => {
  return (
    <>
      <div className="flex gap-5">
        <Input placeholder="Suche bei Namen" />
        <div className="flex gap-2">
          <Button
            className="cursor-pointer"
            onClick={openCreate}
            variant={'outline'}
          >
            Mitarbeiter Hinzufügen
          </Button>
        </div>
      </div>
    </>
  );
};

export default PageHeader;
