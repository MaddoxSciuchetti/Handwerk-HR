import { Button } from '@/components/ui/button';
import { Dispatch, SetStateAction } from 'react';
import { WorkerListMode } from '../types/index.types';

type ActiveArchiveHeaderProps = {
  mode: WorkerListMode;
  setMode: Dispatch<SetStateAction<WorkerListMode>>;
};

const ActiveArchiveHeader = ({ mode, setMode }: ActiveArchiveHeaderProps) => {
  return (
    <>
      <div className="mt-4 flex items-center justify-start gap-2">
        <Button
          type="button"
          variant={mode === 'active' ? 'default' : 'outline'}
          size={'sm'}
          className={
            mode === 'active'
              ? 'h-8 rounded-full px-4 text-xs font-medium shadow-sm ring-2 ring-primary/30'
              : 'h-8 rounded-full px-4 text-xs font-medium text-muted-foreground'
          }
          onClick={() => setMode('active')}
        >
          Aktiv
        </Button>
        <Button
          type="button"
          variant={mode === 'archived' ? 'default' : 'outline'}
          className={
            mode === 'archived'
              ? 'h-8 rounded-full px-4 text-xs font-medium shadow-sm ring-2 ring-primary/30'
              : 'h-8 rounded-full px-4 text-xs font-medium text-muted-foreground'
          }
          onClick={() => setMode('archived')}
        >
          Archiv
        </Button>
      </div>
    </>
  );
};

export default ActiveArchiveHeader;
