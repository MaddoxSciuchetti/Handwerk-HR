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
      <TabsList
        variant={'default'}
        className="rounded-full bg-(--dropdown-surface)"
      >
        <TabsTrigger className="cursor-pointer rounded-full" value="form">
          Aufgaben
        </TabsTrigger>
        <TabsTrigger className="cursor-pointer rounded-full" value="files">
          Dateien
        </TabsTrigger>
      </TabsList>
      <Button
        type="button"
        className="border-0 bg-interactive-primary-bg text-sm text-interactive-primary-text hover:bg-interactive-primary-hover"
        onClick={openForCreate}
      >
        Aufgabe hinzufügen
      </Button>
    </div>
  );
};

export default WorkerHeader;
