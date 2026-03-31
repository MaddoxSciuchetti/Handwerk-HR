import { Button } from '@/components/ui/button';
import { LifecycleType } from '@/features/task-management/types/index.types';
import { Info } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { WorkerRecord } from '../types/index.types';

type WorkerItemInfoProps = {
  setIsInfoModalOpen: Dispatch<SetStateAction<boolean>>;
  gotopage: (
    taskId: string,
    form_type: LifecycleType,
    workerName: string
  ) => void;
  workerId: string;
  form_type: LifecycleType;
  worker: WorkerRecord;
};

const WorkerItemInfo = ({
  setIsInfoModalOpen,
  gotopage,
  workerId,
  form_type,
  worker,
}: WorkerItemInfoProps) => {
  const fullName = `${worker.firstName} ${worker.lastName ?? ''}`.trim();

  return (
    <div className="flex min-w-0 flex-nowrap items-center justify-center gap-2">
      <span className="min-w-0 max-w-[10rem] truncate text-left font-semibold sm:max-w-[14rem]">
        {fullName}
      </span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Handwerker-Informationen"
        title="Informationen"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          setIsInfoModalOpen(true);
        }}
      >
        <Info className="size-4" strokeWidth={1.75} />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 shrink-0 px-2.5 text-xs opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          gotopage(workerId, form_type, fullName);
        }}
      >
        Ansehen
      </Button>
    </div>
  );
};

export default WorkerItemInfo;
