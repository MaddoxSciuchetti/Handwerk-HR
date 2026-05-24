import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  SquareCheckIcon,
  SquareDashedIcon,
} from '@/features/all-tasks/components/ui/SelectIcons';
import { LifecycleType } from '@/features/worker-task-management/types/index.types';
import { cn } from '@/lib/utils';
import type { Dispatch, SetStateAction } from 'react';
import { WorkerRecord } from '../types/index.types';
import { getFirstFormType } from '../utils/formtype';

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

  const toggleSelection = (e: React.MouseEvent) => {
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

  return (
    <TableRow
      className="group relative cursor-pointer border-0"
      onClick={() => gotopage(worker.id, form_type, fullname)}
    >
      <TableCell className="relative pl-14 font-medium">
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
        {worker.firstName}
      </TableCell>
      <TableCell>{worker.engagements[0].type}</TableCell>
      <TableCell>{worker.engagements[0].responsibleUser.firstName}</TableCell>
      <TableCell>{worker.engagements[0].engagementStatus.name}</TableCell>
    </TableRow>
  );
}

export default ProjectItem;
