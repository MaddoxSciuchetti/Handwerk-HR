import { Input } from '@/components/ui/input';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dispatch, SetStateAction } from 'react';

type WorkerHeaderProps = {
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
  searchPlaceholder?: string;
};

const WorkerHeader = ({
  searchValue,
  setSearchValue,
  searchPlaceholder = 'Search',
}: WorkerHeaderProps) => {
  return (
    <div className="flex items-end justify-between gap-5">
      <Input
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={searchPlaceholder}
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
