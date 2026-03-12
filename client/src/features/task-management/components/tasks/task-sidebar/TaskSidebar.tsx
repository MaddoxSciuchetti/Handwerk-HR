import { cn } from '@/lib/trycatch';
import { DescriptionField } from '@/types/api.types';
import { InsertHistoryData } from '../../../types/index.types';
import SidebarBody from '../SidebarBody';
import SidebarHeader from './SidebarHeader';

type TaskSidebarProps = {
  selectedTask: DescriptionField | null;
  setSelectedTaskId: (value: number | null) => void;
  handleSubmit: (values: InsertHistoryData) => Promise<void>;
};

const TaskSidebar = ({
  selectedTask,
  setSelectedTaskId,
  handleSubmit,
}: TaskSidebarProps) => {
  return (
    <aside
      className={cn(
        'fixed right-0 top-0 h-screen border-l border-border bg-(--card) overflow-hidden transition-all duration-300 ease-out z-50',
        selectedTask ? 'w-110' : 'w-0'
      )}
    >
      {selectedTask && (
        <div className="w-105 h-full flex flex-col pt-6">
          <SidebarHeader
            selectedTask={selectedTask}
            setSelectedTaskId={setSelectedTaskId}
          />
          <SidebarBody
            selectedTask={selectedTask}
            handleSubmit={handleSubmit}
          />
        </div>
      )}
    </aside>
  );
};

export default TaskSidebar;
