import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dispatch, SetStateAction } from 'react';

type WorkerHeaderProps = {
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
  searchPlaceholder?: string;
  onCreateIssue?: () => void;
  showApplyFromTemplate?: boolean;
  onApplyFromTemplate?: () => void;
};

const WorkerHeader = ({
  searchValue,
  setSearchValue,
  searchPlaceholder = 'Search',
  onCreateIssue,
  showApplyFromTemplate,
  onApplyFromTemplate,
}: WorkerHeaderProps) => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 md:gap-5">
      <Input
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={searchPlaceholder}
        className="min-w-[12rem] flex-1"
      />
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {onCreateIssue ? (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={onCreateIssue}
          >
            Issue anlegen
          </Button>
        ) : null}
        {showApplyFromTemplate && onApplyFromTemplate ? (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={onApplyFromTemplate}
          >
            Aus Vorlage
          </Button>
        ) : null}
        <TabsList variant={'default'} className="bg-[var(--dropdown-surface)]">
          <TabsTrigger className="cursor-pointer" value="form">
            Aufgaben
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="files">
            Dateien
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  );
};

export default WorkerHeader;
