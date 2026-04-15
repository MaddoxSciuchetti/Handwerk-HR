import { DescriptionField } from '@/types/api.types';
import { Calendar, User, X } from 'lucide-react';

type TaskSidebarHeaderProps = {
  selectedTask: DescriptionField;
  setSelectedTaskId: (value: number | null) => void;
};

function TaskSidebarHeader({
  selectedTask,
  setSelectedTaskId,
}: TaskSidebarHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {selectedTask.is_substitute
            ? selectedTask.substituteOwner
            : selectedTask.officialOwner}
          <span className="mx-1 text-border">·</span>
          <Calendar className="h-3 w-3" />
          {selectedTask.status}
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
  );
}

export default TaskSidebarHeader;
