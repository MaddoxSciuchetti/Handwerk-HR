import { Button } from '@/components/ui/selfmade/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

type WorkerHeaderProps = {
  openForCreate: () => void;
};

const WorkerHeader = ({ openForCreate }: WorkerHeaderProps) => {
  return (
    <div className="flex items-end justify-between gap-5">
      {/* <Input
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={searchPlaceholder}
      /> */}
      <TabsList variant={'default'} className="bg-(--dropdown-surface)">
        <TabsTrigger className="cursor-pointer" value="form">
          Aufgaben
        </TabsTrigger>
        <TabsTrigger className="cursor-pointer" value="files">
          Dateien
        </TabsTrigger>
      </TabsList>
      <Button
        type="button"
        className="bg-black text-white hover:bg-black/90"
        onClick={openForCreate}
      >
        Aufgabe hinzufügen
      </Button>
    </div>
  );
};

export default WorkerHeader;
