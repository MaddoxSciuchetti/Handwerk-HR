import '@/App.css';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/trycatch';
import { Dispatch, SetStateAction } from 'react';
import { TABS } from '../consts/index.consts';

type TabsHeaderProps = {
  tab: 'ONBOARDING' | 'OFFBOARDING';
  setTab: Dispatch<SetStateAction<'ONBOARDING' | 'OFFBOARDING'>>;
};

const TabsHeader = ({ tab, setTab }: TabsHeaderProps) => {
  return (
    <>
      <div className="mb-6 flex items-center justify-between mt-5">
        <div className="inline-flex rounded-lg border border-border/70 bg-(--secondary) p-1">
          {TABS.map(({ value, label }) => (
            <Button
              role="tab"
              aria-selected={tab === value}
              aria-conrols={`tabpanel-${value}`}
              key={value}
              type="button"
              size={'sm'}
              variant={'ghost'}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                tab === value
                  ? 'bg-(--background) text-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-(--hover-bg) hover:text-(--hover-foreground)'
              )}
              onClick={() => setTab(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default TabsHeader;
