import { Input } from '@/components/ui/input';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dispatch, SetStateAction } from 'react';

type WorkerHeaderProps = {
  descriptionSearch: string;
  setDescriptionSearch: Dispatch<SetStateAction<string>>;
};

const WorkerHeader = ({
  descriptionSearch,
  setDescriptionSearch,
}: WorkerHeaderProps) => {
  return (
    <div className="flex justify gap-5">
      <Input
        value={descriptionSearch}
        onChange={(e) => setDescriptionSearch(e.target.value)}
        placeholder="Search"
      />
      <TabsList variant={'default'} className="bg-(--dropdown-surface)">
        <TabsTrigger className="cursor-pointer" value="form">
          Aufgaben
        </TabsTrigger>
        <TabsTrigger className="cursor-pointer" value="files">
          Dateien
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default WorkerHeader;
