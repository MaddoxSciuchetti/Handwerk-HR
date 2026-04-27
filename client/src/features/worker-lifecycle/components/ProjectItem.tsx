import {
  Cell,
  CellHolder,
  GrowingItem,
  Items,
} from '@/components/ui/selfmade/table/Table';

import {
  SquareCheckIcon,
  SquareDashedIcon,
} from '@/features/all-tasks/components/ui/SelectIcons';
import { LifecycleType } from '@/features/worker-task-management/types/index.types';
import { cn } from '@/lib/trycatch';
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
    <Items
      state="hover"
      className="relative flex min-h-12 items-center gap-0 px-4 py-2.5"
      onClick={() => gotopage(worker.id, form_type, fullname)}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={isSelected ? 'Auswahl entfernen' : 'Auswählen'}
        onClick={toggleSelection}
        className={cn(
          'absolute ml-2 flex h-5 w-5 items-center justify-center text-foreground transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <SelectionIcon className="h-5 w-5" />
      </button>
      <GrowingItem className="pl-10 py-0">
        <p className="typo-body-base">{worker.firstName}</p>
      </GrowingItem>
      <CellHolder>
        <Cell>{worker.engagements[0].type}</Cell>
        <Cell>{worker.engagements[0].responsibleUser.firstName}</Cell>
        <Cell>{worker.engagements[0].engagementStatus.name}</Cell>
        <Cell>{worker.status}</Cell>
      </CellHolder>
    </Items>
  );
}

export default ProjectItem;
