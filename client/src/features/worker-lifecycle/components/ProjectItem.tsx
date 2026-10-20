import { TableCell, TableRow } from '@/components/ui/table';
import { RowSelectButton } from '@/features/all-tasks/components/ui/RowSelectButton';
import { LifecycleType } from '@/features/worker-task-management/types/index.types';
import { cn } from '@/lib/utils';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import { EngagementType, WorkerRecord } from '../types/index.types';
import { getFirstFormType } from '../utils/formtype';
import { getWorkerIssueCount } from '../utils/workerHealth.utils';
import WorkerEngagementInfoButton from './WorkerEngagementInfoButton';
import { EngagementProgressPicker } from './ui/EngagementProgressPicker';
import EngagementTypeSwitch from './EngagementTypeSwitch';
import {
  ResponsibleUserPicker,
  type ResponsibleUserOption,
} from './ResponsibleUserPicker';

export type WorkerSelection = {
  engagementNumber: string;
  engagementTitle: string;
  engagementId: string;
  type: EngagementType;
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
  onTypeChange: (type: EngagementType) => void;
  isChangingType: boolean;
  responsibleUsers: ResponsibleUserOption[];
  onResponsibleChange: (userId: string) => void;
  isChangingResponsible: boolean;
};

function ProjectItem({
  worker,
  gotopage,
  isSelected,
  setLargeEditMode,
  setEditModeData,
  onTypeChange,
  isChangingType,
  responsibleUsers,
  onResponsibleChange,
  isChangingResponsible,
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
        : [
            ...prev,
            {
              engagementNumber: worker.id,
              engagementTitle: fullname,
              engagementId: worker.engagements[0].id,
              type: worker.engagements[0].type,
            },
          ]
    );
  };

  const issueCount = getWorkerIssueCount(worker);

  return (
    <TableRow
      className="group relative cursor-pointer border-0 hover:bg-transparent"
      onClick={(event) => {
        const target = event.target;
        if (target instanceof Element && target.closest('[data-row-select]')) {
          return;
        }
        gotopage(worker.id, form_type, fullname);
      }}
    >
      <TableCell
        className={cn(
          'relative pl-10 pr-2 font-medium transition-colors group-hover:rounded-l-xl group-hover:bg-muted/50',
          isSelected && 'rounded-l-xl bg-muted/50'
        )}
      >
        <RowSelectButton isSelected={isSelected} onClick={toggleSelection} />
        <span className="inline-flex items-center gap-2 pl-2">
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
        <div onClick={(event) => event.stopPropagation()}>
          <EngagementTypeSwitch
            value={worker.engagements[0].type}
            workerName={fullname.trim()}
            disabled={isChangingType}
            onSwitch={onTypeChange}
          />
        </div>
      </TableCell>
      <TableCell
        className={cn(
          'transition-colors group-hover:bg-muted/50',
          isSelected && 'bg-muted/50'
        )}
      >
        <div onClick={(event) => event.stopPropagation()}>
          <ResponsibleUserPicker
            value={worker.engagements[0].responsibleUser}
            options={responsibleUsers}
            workerName={fullname.trim()}
            disabled={isChangingResponsible}
            onChange={onResponsibleChange}
          />
        </div>
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
