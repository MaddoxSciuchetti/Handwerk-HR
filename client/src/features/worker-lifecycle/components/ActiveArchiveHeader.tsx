import { Button } from '@/components/ui/button';
import { Dispatch, SetStateAction } from 'react';
import { EngagementStatus } from '../types/index.types';

type ActiveArchiveHeaderProps = {
  engagementStatus: EngagementStatus;
  setEngagementStatus: Dispatch<SetStateAction<EngagementStatus>>;
};

const ActiveArchiveHeader = ({
  engagementStatus,
  setEngagementStatus,
}: ActiveArchiveHeaderProps) => {
  return (
    <>
      <div className="mt-4 flex items-center justify-start gap-2">
        <Button
          type="button"
          variant={engagementStatus === 'active' ? 'default' : 'outline'}
          size={'sm'}
          className={
            engagementStatus === 'active'
              ? 'h-8 rounded-full px-4 text-xs font-medium shadow-sm ring-2 ring-primary/30'
              : 'h-8 rounded-full px-4 text-xs font-medium text-muted-foreground'
          }
          onClick={() => setEngagementStatus('active')}
        >
          Aktiv
        </Button>
        <Button
          type="button"
          variant={engagementStatus === 'archived' ? 'default' : 'outline'}
          className={
            engagementStatus === 'archived'
              ? 'h-8 rounded-full px-4 text-xs font-medium shadow-sm ring-2 ring-primary/30'
              : 'h-8 rounded-full px-4 text-xs font-medium text-muted-foreground'
          }
          onClick={() => setEngagementStatus('archived')}
        >
          Archiv
        </Button>
      </div>
    </>
  );
};

export default ActiveArchiveHeader;
