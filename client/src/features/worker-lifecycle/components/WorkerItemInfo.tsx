import { Button } from '@/components/ui/button';
import { LifecycleType } from '@/features/task-management/types/index.types';
import { Info } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

type WorkerItemInfoProps = {
  setIsInfoModalOpen: Dispatch<SetStateAction<boolean>>;
  gotopage: (
    taskId: string,
    form_type: LifecycleType,
    workerName: string
  ) => void;
  item_value: string;
  form_type: LifecycleType;
  vorname: string;
  nachname: string | undefined;
};

const WorkerItemInfo = ({
  setIsInfoModalOpen,
  gotopage,
  item_value,
  form_type,
  vorname,
  nachname,
}: WorkerItemInfoProps) => {
  return (
    <>
      <div className="flex items-center gap-3">
        <span>
          {vorname} {nachname}
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Handwerker Informationen"
          className="cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            setIsInfoModalOpen(true);
          }}
        >
          <Info className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size={'sm'}
          variant="outline"
          className="cursor-pointer opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100"
          onClick={() =>
            gotopage(
              item_value,
              form_type,
              `${vorname} ${nachname ?? ''}`.trim()
            )
          }
        >
          Anschauen
        </Button>
      </div>
    </>
  );
};

export default WorkerItemInfo;
