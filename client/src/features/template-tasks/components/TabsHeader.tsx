import { Button } from '@/components/ui/button';
import { cn } from '@/lib/trycatch';
import { PlusSquare } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { TABS } from '../consts/index.consts';

type TabsHeaderProps = {
  tab: 'ONBOARDING' | 'OFFBOARDING';
  setTab: Dispatch<SetStateAction<'ONBOARDING' | 'OFFBOARDING'>>;
  openDescriptionModal: () => void;
  setMode: Dispatch<SetStateAction<'ADD' | 'EDIT' | undefined>>;
};

const TabsHeader = ({
  tab,
  setTab,
  openDescriptionModal,
  setMode,
}: TabsHeaderProps) => {
  return (
    <>
      {/* <div className="flex gap-2 justify-start items-center "> */}
      <div className="mb-6 flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          {TABS.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              size={'sm'}
              variant={'ghost'}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                tab === value
                  ? 'bg-(--dropdown-surface) text-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-(--hover-bg) hover:text-(--hover-foreground)'
              )}
              onClick={() => setTab(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          className="gap-1.5 cursor-pointer bg-accent"
          variant={'outline'}
        >
          <PlusSquare
            className="w-7 cursor-pointer"
            onClick={() => {
              openDescriptionModal();
              setMode('ADD');
            }}
          />
          Add Task
        </Button>
      </div>
      {/* </div> */}
    </>
  );
};

export default TabsHeader;
