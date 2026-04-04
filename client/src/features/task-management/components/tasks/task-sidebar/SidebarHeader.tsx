import { DescriptionField } from '@/types/api.types';
import { Calendar, User, X } from 'lucide-react';
import {
  STATUS_MAP,
  type TaskStatus,
} from '../../../utils/selectOptionTernary';

type SidebarHeaderProps = {
  selectedTask: DescriptionField;
  setSelectedTaskId: (value: string | number | null) => void;
};

function statusLineLabel(task: DescriptionField): string {
  if (task.issueStatusName) return task.issueStatusName;
  const legacy = STATUS_MAP[task.status as TaskStatus]?.label;
  if (legacy) return legacy;
  return String(task.status ?? '');
}

const SidebarHeader = ({
  selectedTask,
  setSelectedTaskId,
}: SidebarHeaderProps) => {
  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {selectedTask.is_substitute
              ? selectedTask.substituteOwner
              : selectedTask.officialOwner}
            <span className="mx-1 text-border">·</span>
            <Calendar className="h-3 w-3" />
            {statusLineLabel(selectedTask)}
          </p>
          <h2 className="text-sm font-semibold leading-snug text-foreground">
            {selectedTask.description}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setSelectedTaskId(null)}
          className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
};

export default SidebarHeader;
