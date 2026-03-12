import { cn } from '@/lib/trycatch';
import { DescriptionField } from '@/types/api.types';
import { Calendar, User, X } from 'lucide-react';
import { SubmitEvent } from 'react';
import ModalContent from '../../modal/TaskModalContent';
import HistoryContent from '../../task-history/HistoryContent';

type TaskSidebarProps = {
  selectedTask: DescriptionField | null;
  setSelectedTaskId: (value: number | null) => void;
  handleSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>;
};

const TaskSidebar = ({
  selectedTask,
  setSelectedTaskId,
  handleSubmit,
}: TaskSidebarProps) => {
  return (
    <>
      <aside
        className={cn(
          'fixed right-0 top-0 h-screen border-l border-border bg-(--card) overflow-hidden transition-all duration-300 ease-out z-50',
          selectedTask ? 'w-110' : 'w-0'
        )}
      >
        {selectedTask && (
          <div className="w-105 h-full flex flex-col pt-6">
            {/* Sidebar Header */}
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

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5">
                <ModalContent
                  key={selectedTask.id}
                  id={selectedTask.id}
                  description={selectedTask.description}
                  editcomment={selectedTask.edit}
                  select_option={selectedTask.status}
                  form_field_id={selectedTask.form_field_id}
                  handleSubmit={handleSubmit}
                />
              </div>
              <div className="px-2 pb-5">
                <HistoryContent id_original={selectedTask.id} />
              </div>
            </div>

            {/* Sidebar Footer */}
          </div>
        )}
      </aside>
    </>
  );
};

export default TaskSidebar;
