import { DescriptionField } from '@/types/api.types';
import { Calendar, User, X } from 'lucide-react';

type SidebarHeaderProps = {
  selectedTask: DescriptionField;
  setSelectedTaskId: (value: number | null) => void;
};

const SidebarHeader = ({
  selectedTask,
  setSelectedTaskId,
}: SidebarHeaderProps) => {
  return (
    <>
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
            <User className="h-3 w-3" />
            {selectedTask.is_substitute
              ? selectedTask.substituteOwner
              : selectedTask.officialOwner}
            <span className="mx-1 text-border">·</span>
            <Calendar className="h-3 w-3" />
            {selectedTask.status}
          </p>
          <h2 className="text-sm font-semibold text-foreground leading-snug">
            {selectedTask.description}
          </h2>
        </div>
        <button
          onClick={() => setSelectedTaskId(null)}
          className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
};

export default SidebarHeader;
