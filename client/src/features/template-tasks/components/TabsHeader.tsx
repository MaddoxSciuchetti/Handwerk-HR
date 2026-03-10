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
      <div className="flex gap-2 justify-start items-center ">
        {TABS.map(({ value, label }) => (
          <Button
            key={value}
            variant={'outline'}
            className={cn(
              'cursor-pointer rounded-xl font-light transition-colors hover:bg-(--hover-bg) hover:text-(--hover-foreground)',
              tab === value && 'bg-accent text-accent-foreground'
            )}
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
        <PlusSquare
          className="w-7 cursor-pointer"
          onClick={() => {
            openDescriptionModal();
            setMode('ADD');
          }}
        />
      </div>
    </>
  );
};

export default TabsHeader;
