import { Button } from '@/components/ui/button';
import { cn } from '@/lib/trycatch';
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
      <div className="flex gap-2 justify-start">
        {TABS.map(({ value, label }) => (
          <Button
            key={value}
            variant={'outline'}
            className={cn(
              'cursor-pointer rounded-xl bg-white font-light',
              tab === value ? 'bg-gray-200' : 'bg-white'
            )}
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
        <img
          className="w-7 cursor-pointer"
          src="assets/copy.svg"
          onClick={() => {
            openDescriptionModal();
            setMode('ADD');
          }}
          alt="add description"
        />
      </div>
    </>
  );
};

export default TabsHeader;
