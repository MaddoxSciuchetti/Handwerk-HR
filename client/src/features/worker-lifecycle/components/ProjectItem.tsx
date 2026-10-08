import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  SquareCheckIcon,
  SquareDashedIcon,
} from '@/features/all-tasks/components/ui/SelectIcons';
import { LifecycleType } from '@/features/worker-task-management/types/index.types';
import { cn } from '@/lib/utils';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import { WorkerRecord } from '../types/index.types';
import { getFirstFormType } from '../utils/formtype';
import { getWorkerIssueCount } from '../utils/workerHealth.utils';
import WorkerEngagementInfoButton from './WorkerEngagementInfoButton';
import { EngagementProgressPicker } from './ui/EngagementProgressPicker';

export type WorkerSelection = {
  engagementNumber: string;
  engagementTitle: string;
};

type ProjectItemProps = {
  worker: WorkerRecord;
  gotopage: (
    taskId: string,
    form_type: LifecycleType,
    workerName: string
  ) => void;
  isSelected: boolean;
  setLargeEditMode: Dispatch<SetStateAction<boolean>>;
  setEditModeData: Dispatch<SetStateAction<WorkerSelection[]>>;
};

function ProjectItem({
  worker,
  gotopage,
  isSelected,
  setLargeEditMode,
  setEditModeData,
}: ProjectItemProps) {
  const form_type = getFirstFormType(worker);
  const fullname = `${worker.firstName} ${worker.lastName}`;

  const toggleSelection = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLargeEditMode(true);
    setEditModeData((prev) =>
      prev.some((item) => item.engagementNumber === worker.id)
        ? prev.filter((item) => item.engagementNumber !== worker.id)
        : [...prev, { engagementNumber: worker.id, engagementTitle: fullname }]
    );
  };

  const SelectionIcon = isSelected ? SquareCheckIcon : SquareDashedIcon;
  const issueCount = getWorkerIssueCount(worker);

  return (
    <TableRow
      className="group relative cursor-pointer border-0 hover:bg-transparent"
      onClick={() => gotopage(worker.id, form_type, fullname)}
    >
      <TableCell
        className={cn(
          'relative pl-10 pr-2 font-medium transition-colors group-hover:rounded-l-xl group-hover:bg-muted/50',
          isSelected && 'rounded-l-xl bg-muted/50'
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-pressed={isSelected}
          aria-label={isSelected ? 'Auswahl entfernen' : 'Auswählen'}
          onClick={toggleSelection}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 rounded-2xl',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <SelectionIcon className="size-4" />
        </Button>
        <span className="inline-flex items-center gap-2">
          {worker.firstName}
          <WorkerEngagementInfoButton workerId={worker.id} />
        </span>
      </TableCell>
      <TableCell
        className={cn(
          'transition-colors group-hover:bg-muted/50',
          isSelected && 'bg-muted/50'
        )}
      >
        {worker.engagements[0].type}
      </TableCell>
      <TableCell
        className={cn(
          'transition-colors group-hover:bg-muted/50',
          isSelected && 'bg-muted/50'
        )}
      >
        {worker.engagements[0].responsibleUser.firstName}
      </TableCell>
      <TableCell
        className={cn(
          'text-sm tabular-nums text-muted-foreground transition-colors group-hover:bg-muted/50',
          isSelected && 'bg-muted/50'
        )}
      >
        {issueCount}
      </TableCell>
      <TableCell
        className={cn(
          'transition-colors group-hover:rounded-r-xl group-hover:bg-muted/50',
          isSelected && 'rounded-r-xl bg-muted/50'
        )}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <EngagementProgressPicker
            worker={worker}
            workerId={worker.id}
            engagementId={worker.engagements[0].id}
            status={worker.engagements[0].status}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export default ProjectItem;
